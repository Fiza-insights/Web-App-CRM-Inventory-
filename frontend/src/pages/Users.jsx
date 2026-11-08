import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { api, getUser } from "../api.js";

const EMPTY = { name: "", email: "", password: "", role: "user" };
const ROLE_CLASS = { admin: "act-amber", manager: "act-blue", user: "role-user" };

function fmt(s) {
  return new Date(s.replace(" ", "T") + "Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export default function Users() {
  const me = getUser();

  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    api("/users")
      .then(function (d) { setRows(d); setError(""); })
      .catch(function (e) { setError(e.message); });
  }

  useEffect(function () {
    if (me.role === "admin") load();
  }, []);

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

  function openEdit(u) {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: "", role: u.role });
    setFormError("");
  }

  async function save(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (editing.id) {
        await api("/users/" + editing.id, {
          method: "PUT",
          body: { name: form.name, role: form.role, password: form.password }
        });
      } else {
        await api("/users", { method: "POST", body: form });
      }
      setEditing(null);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function remove(u) {
    if (!window.confirm("Delete user " + u.name + "?")) return;
    api("/users/" + u.id, { method: "DELETE" })
      .then(load)
      .catch(function (e) { setError(e.message); });
  }

  if (me.role !== "admin") {
    return (
      <div className="card pad">
        <p className="muted">Only admins can manage users.</p>
      </div>
    );
  }

  const isSelf = editing && editing.id === me.id;

  return (
    <div className="card pad">
      <div className="page-head">
        <p className="muted" style={{ margin: 0 }}>{rows.length} users</p>
        <button className="btn accent" onClick={openNew}><Plus size={16} style={{ verticalAlign: "middle" }} /> Add user</button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(function (u) {
              return (
                <tr key={u.id}>
                  <td>{u.name}{u.id === me.id && <span className="muted"> (you)</span>}</td>
                  <td className="muted">{u.email}</td>
                  <td><span className={"badge " + ROLE_CLASS[u.role]} style={{ textTransform: "capitalize" }}>{u.role}</span></td>
                  <td className="muted">{fmt(u.created_at)}</td>
                  <td>
                    <div className="row-actions">
                      <button className="row-btn" title="Edit" onClick={function () { openEdit(u); }}><Pencil size={15} /></button>
                      {u.id !== me.id && (
                        <button className="row-btn danger" title="Delete" onClick={function () { remove(u); }}><Trash2 size={15} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="modal-backdrop">
          <form className="card modal" style={{ maxWidth: 460 }} onSubmit={save}>
            <div className="modal-head">
              <h2>{editing.id ? "Edit user" : "Add user"}</h2>
              <button type="button" className="row-btn" onClick={function () { setEditing(null); }}><X size={16} /></button>
            </div>

            <label>Name</label>
            <input value={form.name} onChange={function (e) { set("name", e.target.value); }} placeholder="Full name" required autoFocus />

            <label>Email</label>
            <input type="email" value={form.email} onChange={function (e) { set("email", e.target.value); }} placeholder="name@example.com" required disabled={!!editing.id} />

            <label>{editing.id ? "New password (leave empty to keep the same)" : "Password"}</label>
            <input type="password" value={form.password} onChange={function (e) { set("password", e.target.value); }} placeholder="At least 6 characters" required={!editing.id} minLength={editing.id ? undefined : 6} />

            <label>Role</label>
            <select value={form.role} onChange={function (e) { set("role", e.target.value); }} disabled={isSelf}>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="user">User</option>
            </select>
            {isSelf && <div className="hint">You cannot change your own role.</div>}

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
