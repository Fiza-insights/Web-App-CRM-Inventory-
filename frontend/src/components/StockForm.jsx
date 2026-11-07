import { useState } from "react";
import { X } from "lucide-react";
import { api } from "../api.js";

export default function StockForm(props) {
  const item = props.item;
  const [type, setType] = useState("in");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const q = Number(quantity);
  const valid = Number.isInteger(q) && q > 0;
  const after = valid ? (type === "in" ? item.quantity + q : item.quantity - q) : null;
  const tooMuch = valid && type === "out" && q > item.quantity;

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api("/stock/move", {
        method: "POST",
        body: { item_id: item.id, type: type, quantity: quantity, note: note }
      });
      props.onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <form className="card modal" style={{ maxWidth: 440 }} onSubmit={submit}>
        <div className="modal-head">
          <h2>Stock In / Out</h2>
          <button type="button" className="row-btn" onClick={props.onClose}><X size={16} /></button>
        </div>
        <p className="muted" style={{ margin: "6px 0 0" }}>{item.name} ({item.sku})</p>
        <p style={{ margin: "4px 0 0" }}>Current quantity: <b>{item.quantity}</b></p>

        <div className="toggle-row">
          <button type="button" className={"toggle" + (type === "in" ? " active-in" : "")} onClick={function () { setType("in"); }}>Stock In</button>
          <button type="button" className={"toggle" + (type === "out" ? " active-out" : "")} onClick={function () { setType("out"); }}>Stock Out</button>
        </div>

        <label>Quantity</label>
        <input type="number" min="1" step="1" value={quantity} onChange={function (e) { setQuantity(e.target.value); }} placeholder="e.g. 10" required />

        <label>Note (optional)</label>
        <input value={note} onChange={function (e) { setNote(e.target.value); }} placeholder="e.g. Received from supplier" />

        {valid && !tooMuch && <p className="hint">New quantity will be: <b>{after}</b></p>}
        {tooMuch && <div className="error">Not enough stock. Only {item.quantity} available.</div>}
        {error && <div className="error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn" onClick={props.onClose}>Cancel</button>
          <button type="submit" className="btn accent" disabled={saving || tooMuch}>{saving ? "Saving..." : "Confirm"}</button>
        </div>
      </form>
    </div>
  );
}
