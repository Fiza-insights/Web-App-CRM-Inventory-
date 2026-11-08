import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { api, getUser } from "../api.js";

export default function Categories() {
  const user = getUser();
  const canEdit = user.role === "admin" || user.role === "manager";

  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    api("/categories")
      .then(function (d) { setRows(d); setError(""); })
      .catch(function (e) { setError(e.message); });
  }

  useEffect(function () { load(); }, []);

  function openNew() {
    setEditing({});
    setName("");
    setFormError("");
  }

  function openEdit(c) {
    setEditing(c);
    setName(c.name);
    setFormError("");
  }

  async function save(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (editing.id) {
        await api("/categories/" + editing.id, { method: "PUT", body: { name: name } });
      } else {
        await api("/categories", { method: "POST", body: { name: name } });
      }
      setEditing(null);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function remove(c) {
    if (!window.confirm("Delete category " + c.name + "?")) return;
    api("/categories/" + c.id, { method: "DELETE" })
      .then(load)
      .catch(function (e) { setError(e.message); });
  }

  return (
    <div className="card pad">
      <div className="page-head">
        <p className="muted" style={{ margin: 0 }}>{rows.length} categories</p>
        {canEdit && (
          <button className="btn accent" onClick={openNew}><Plus size={16} style={{ verticalAlign: "middle" }} /> Add category</button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Items</th>
              {canEdit && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(function (c) {
              return (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td className="muted">{c.item_count}</td>
                  {canEdit && (
                    <td>
                      <div className="row-actions">
                        <button className="row-btn" title="Rename" onClick={function () { openEdit(c); }}><Pencil size={15} /></button>
                        <button className="row-btn danger" title="Delete" onClick={function () { remove(c); }}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && !error && <p className="muted" style={{ padding: 16 }}>No categories yet.</p>}
      </div>

      {editing && (
        <div className="modal-backdrop">
          <form className="card modal" style={{ maxWidth: 420 }} onSubmit={save}>
            <div className="modal-head">
              <h2>{editing.id ? "Rename category" : "Add category"}</h2>
              <button type="button" className="row-btn" onClick={function () { setEditing(null); }}><X size={16} /></button>
            </div>
            <label>Name</label>
            <input value={name} onChange={function (e) { setName(e.target.value); }} placeholder="e.g. Stationery" required autoFocus />
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
