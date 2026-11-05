const express = require("express");
const db = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");
const logActivity = require("../utils/activity");

const router = express.Router();
const canEdit = requireRole("admin", "manager");

router.use(authenticate);

function clean(body) {
  const b = body || {};
  return {
    name: String(b.name || "").trim(),
    email: String(b.email || "").trim() || null,
    phone: String(b.phone || "").trim() || null
  };
}

router.get("/", function (req, res) {
  const rows = db.prepare(
    "SELECT s.id, s.name, s.email, s.phone, COUNT(i.id) AS item_count FROM suppliers s LEFT JOIN items i ON i.supplier_id = s.id GROUP BY s.id ORDER BY s.name"
  ).all();
  res.json(rows);
});

router.post("/", canEdit, function (req, res) {
  const s = clean(req.body);
  if (!s.name) return res.status(400).json({ error: "Name is required" });
  const result = db.prepare("INSERT INTO suppliers (name, email, phone) VALUES (?, ?, ?)").run(s.name, s.email, s.phone);
  logActivity(req.user.id, "created", "supplier", result.lastInsertRowid, s.name);
  res.status(201).json({ id: result.lastInsertRowid, name: s.name, email: s.email, phone: s.phone });
});

router.put("/:id", canEdit, function (req, res) {
  const s = clean(req.body);
  if (!s.name) return res.status(400).json({ error: "Name is required" });
  const result = db.prepare("UPDATE suppliers SET name = ?, email = ?, phone = ? WHERE id = ?").run(s.name, s.email, s.phone, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Supplier not found" });
  logActivity(req.user.id, "updated", "supplier", Number(req.params.id), s.name);
  res.json({ id: Number(req.params.id), name: s.name, email: s.email, phone: s.phone });
});

router.delete("/:id", canEdit, function (req, res) {
  const used = db.prepare("SELECT COUNT(*) AS n FROM items WHERE supplier_id = ?").get(req.params.id).n;
  if (used > 0) return res.status(409).json({ error: "Supplier has items, cannot delete" });
  const result = db.prepare("DELETE FROM suppliers WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Supplier not found" });
  logActivity(req.user.id, "deleted", "supplier", Number(req.params.id), null);
  res.json({ ok: true });
});

module.exports = router;
