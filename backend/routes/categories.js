const express = require("express");
const db = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");
const logActivity = require("../utils/activity");

const router = express.Router();
const canEdit = requireRole("admin", "manager");

router.use(authenticate);

router.get("/", function (req, res) {
  const rows = db.prepare(
    "SELECT c.id, c.name, COUNT(i.id) AS item_count FROM categories c LEFT JOIN items i ON i.category_id = c.id GROUP BY c.id ORDER BY c.name"
  ).all();
  res.json(rows);
});

router.post("/", canEdit, function (req, res) {
  const name = String((req.body || {}).name || "").trim();
  if (!name) return res.status(400).json({ error: "Name is required" });
  try {
    const result = db.prepare("INSERT INTO categories (name) VALUES (?)").run(name);
    logActivity(req.user.id, "created", "category", result.lastInsertRowid, name);
    res.status(201).json({ id: result.lastInsertRowid, name: name });
  } catch (e) {
    if (e.code === "SQLITE_CONSTRAINT_UNIQUE") return res.status(409).json({ error: "Category already exists" });
    throw e;
  }
});

router.put("/:id", canEdit, function (req, res) {
  const name = String((req.body || {}).name || "").trim();
  if (!name) return res.status(400).json({ error: "Name is required" });
  try {
    const result = db.prepare("UPDATE categories SET name = ? WHERE id = ?").run(name, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: "Category not found" });
    logActivity(req.user.id, "updated", "category", Number(req.params.id), name);
    res.json({ id: Number(req.params.id), name: name });
  } catch (e) {
    if (e.code === "SQLITE_CONSTRAINT_UNIQUE") return res.status(409).json({ error: "Category already exists" });
    throw e;
  }
});

router.delete("/:id", canEdit, function (req, res) {
  const used = db.prepare("SELECT COUNT(*) AS n FROM items WHERE category_id = ?").get(req.params.id).n;
  if (used > 0) return res.status(409).json({ error: "Category has items, cannot delete" });
  const result = db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Category not found" });
  logActivity(req.user.id, "deleted", "category", Number(req.params.id), null);
  res.json({ ok: true });
});

module.exports = router;
