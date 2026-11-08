import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { api, getUser } from "../api.js";

const EMPTY = { name: "", email: "", phone: "" };

export default function Suppliers() {
  const user = getUser();
  const canEdit = user.role === "admin" || user.role === "manager";

  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    api("/suppliers")
      .then(function (d) { setRows(d); setError(""); })
      .catch(function (e) { setError(e.message); });
  }

  useEffect(function () { load(); }, []);

  function set(field, value) {
    setForm(function (f) {
      const next = Object.assign({}, f);
      next[field] = value;
      return next;
    });
  }

  function openNew() {
    setEditing({});
    setForm(EMPTY);
    setFormError("");
  }

  function openEdit(s) {
    setEditing(s);
    setForm({ name: s.name, email: s.email || "", phone: s.phone || "" });
    setFormError("");
  }

  async function save(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (editing.id) {
        await api("/suppliers/" + editing.id, { method: "PUT", body: form });
      } else {
        await api("/suppliers", { method: "POST", body: form });
      }
      setEditing(null);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function remove(s) {
    if (!window.confirm("Delete supplier " + s.name + "?")) return;
    api("/suppliers/" + s.id, { method: "DELETE" })
      .then(load)
      .catch(function (e) { setError(e.message); });
  }

  return (
    <div className="card pad">
      <div className="page-head">
        <p className="muted" style={{ margin: 0 }}>{rows.length} suppliers</p>
        {canEdit && (
          <button className="btn accent" onClick={openNew}><Plus size={16} style={{ verticalAlign: "middle" }} /> Add supplier</button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Items</th>
              {canEdit && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(function (s) {
              return (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td className="muted">{s.email || "-"}</td>
                  <td className="muted">{s.phone || "-"}</td>
                  <td className="muted">{s.item_count}</td>
                  {canEdit && (
                    <td>
                      <div className="row-actions">
                        <button className="row-btn" title="Edit" onClick={function () { openEdit(s); }}><Pencil size={15} /></button>
                        <button className="row-btn danger" title="Delete" onClick={function () { remove(s); }}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && !error && <p className="muted" style={{ padding: 16 }}>No suppliers yet.</p>}
      </div>

      {editing && (
        <div className="modal-backdrop">
          <form className="card modal" style={{ maxWidth: 460 }} onSubmit={save}>
            <div className="modal-head">
              <h2>{editing.id ? "Edit supplier" : "Add supplier"}</h2>
              <button type="button" className="row-btn" onClick={function () { setEditing(null); }}><X size={16} /></button>
            </div>

            <label>Name</label>
            <input value={form.name} onChange={function (e) { set("name", e.target.value); }} placeholder="e.g. Metro Traders" required autoFocus />

            <label>Email (optional)</label>
            <input type="email" value={form.email} onChange={function (e) { set("email", e.target.value); }} placeholder="sales@example.com" />

            <label>Phone (optional)</label>
            <input value={form.phone} onChange={function (e) { set("phone", e.target.value); }} placeholder="0300-1234567" />

            {formError && <div className="error">{formError}</div>}

            <div className="form-actions">
              <button type="button" className="btn" onClick={function () { setEditing(null); }}>Cancel</button>
              <button type="submit" className="btn accent" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
