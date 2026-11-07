import { useState } from "react";
import { X } from "lucide-react";
import { api } from "../api.js";

export default function ItemForm(props) {
  const item = props.item;
  const [form, setForm] = useState({
    sku: item ? item.sku : "",
    name: item ? item.name : "",
    category_id: item && item.category_id ? String(item.category_id) : "",
    supplier_id: item && item.supplier_id ? String(item.supplier_id) : "",
    price: item ? item.price : "",
    quantity: 0,
    reorder_level: item ? item.reorder_level : 5
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field, value) {
    setForm(function (f) {
      const next = Object.assign({}, f);
      next[field] = value;
      return next;
    });
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const body = {
        sku: form.sku,
        name: form.name,
        category_id: form.category_id,
        supplier_id: form.supplier_id,
        price: form.price,
        reorder_level: form.reorder_level
      };
      if (item) {
        await api("/items/" + item.id, { method: "PUT", body: body });
      } else {
        body.quantity = form.quantity;
        await api("/items", { method: "POST", body: body });
      }
      props.onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <form className="card modal" onSubmit={submit}>
        <div className="modal-head">
          <h2>{item ? "Edit item" : "Add item"}</h2>
          <button type="button" className="row-btn" onClick={props.onClose}><X size={16} /></button>
        </div>

        <div className="form-grid">
          <div>
            <label>SKU</label>
            <input value={form.sku} onChange={function (e) { set("sku", e.target.value); }} placeholder="e.g. ELE-120" required />
          </div>
          <div>
            <label>Name</label>
            <input value={form.name} onChange={function (e) { set("name", e.target.value); }} placeholder="Item name" required />
          </div>
          <div>
            <label>Category</label>
            <select value={form.category_id} onChange={function (e) { set("category_id", e.target.value); }}>
              <option value="">None</option>
              {props.categories.map(function (c) { return <option key={c.id} value={c.id}>{c.name}</option>; })}
            </select>
          </div>
          <div>
            <label>Supplier</label>
            <select value={form.supplier_id} onChange={function (e) { set("supplier_id", e.target.value); }}>
              <option value="">None</option>
              {props.suppliers.map(function (s) { return <option key={s.id} value={s.id}>{s.name}</option>; })}
            </select>
          </div>
          <div>
            <label>Price (Rs)</label>
            <input type="number" min="0" step="any" value={form.price} onChange={function (e) { set("price", e.target.value); }} required />
          </div>
          <div>
            <label>Reorder level</label>
            <input type="number" min="0" step="1" value={form.reorder_level} onChange={function (e) { set("reorder_level", e.target.value); }} required />
          </div>
          {!item && (
            <div className="full">
              <label>Opening quantity</label>
              <input type="number" min="0" step="1" value={form.quantity} onChange={function (e) { set("quantity", e.target.value); }} required />
            </div>
          )}
          {item && (
            <div className="full hint">Quantity cannot be edited here. Use Stock In / Out to change it, so every change is recorded.</div>
          )}
        </div>

        {error && <div className="error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn" onClick={props.onClose}>Cancel</button>
          <button type="submit" className="btn accent" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
        </div>
      </form>
    </div>
  );
}
