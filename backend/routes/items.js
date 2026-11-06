const express = require("express");
const db = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");
const logActivity = require("../utils/activity");

const router = express.Router();
const canEdit = requireRole("admin", "manager");

router.use(authenticate);

const SORT_COLUMNS = {
  name: "i.name",
  sku: "i.sku",
  price: "i.price",
  quantity: "i.quantity",
  created_at: "i.created_at"
};

const SELECT_ITEM =
  "SELECT i.*, c.name AS category_name, s.name AS supplier_name FROM items i " +
  "LEFT JOIN categories c ON c.id = i.category_id " +
  "LEFT JOIN suppliers s ON s.id = i.supplier_id ";

function withStatus(item) {
  let status = "in_stock";
  if (item.quantity === 0) status = "out";
  else if (item.quantity <= item.reorder_level) status = "low";
  return Object.assign({}, item, { status: status });
}

function readItem(body) {
  const b = body || {};
  const toId = function (v) { return v === "" || v === undefined || v === null ? null : Number(v); };
  return {
    sku: String(b.sku || "").trim(),
    name: String(b.name || "").trim(),
    category_id: toId(b.category_id),
    supplier_id: toId(b.supplier_id),
    price: Number(b.price === undefined ? 0 : b.price),
    quantity: Number(b.quantity === undefined ? 0 : b.quantity),
    reorder_level: Number(b.reorder_level === undefined ? 5 : b.reorder_level)
  };
}

function validate(it, checkQuantity) {
  if (!it.sku) return "SKU is required";
  if (!it.name) return "Name is required";
  if (!(it.price >= 0)) return "Price must be 0 or more";
  if (!Number.isInteger(it.reorder_level) || it.reorder_level < 0) return "Reorder level must be a whole number, 0 or more";
  if (checkQuantity && (!Number.isInteger(it.quantity) || it.quantity < 0)) return "Quantity must be a whole number, 0 or more";
  return null;
}

function handleDbError(e, res) {
  if (e.code === "SQLITE_CONSTRAINT_UNIQUE") return res.status(409).json({ error: "SKU already exists" });
  if (e.code === "SQLITE_CONSTRAINT_FOREIGNKEY") return res.status(400).json({ error: "Invalid category or supplier" });
  throw e;
}

router.get("/", function (req, res) {
  const q = req.query;
  const where = [];
  const params = [];

  if (q.search) {
    where.push("(i.name LIKE ? OR i.sku LIKE ?)");
    const like = "%" + q.search + "%";
    params.push(like, like);
  }
  if (q.category_id) {
    where.push("i.category_id = ?");
    params.push(q.category_id);
  }
  if (q.status === "out") where.push("i.quantity = 0");
  else if (q.status === "low") where.push("i.quantity > 0 AND i.quantity <= i.reorder_level");
  else if (q.status === "in_stock") where.push("i.quantity > i.reorder_level");

  const whereSql = where.length ? "WHERE " + where.join(" AND ") + " " : "";
  const sortCol = SORT_COLUMNS[q.sort] || "i.name";
  const order = q.order === "desc" ? "DESC" : "ASC";
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || 10, 1), 100);
  const page = Math.max(parseInt(q.page, 10) || 1, 1);

  const total = db.prepare("SELECT COUNT(*) AS n FROM items i " + whereSql).get(...params).n;
  const rows = db.prepare(
    SELECT_ITEM + whereSql + "ORDER BY " + sortCol + " " + order + ", i.id LIMIT ? OFFSET ?"
  ).all(...params, limit, (page - 1) * limit);

  res.json({
    items: rows.map(withStatus),
    page: page,
    limit: limit,
    total: total,
    total_pages: Math.max(Math.ceil(total / limit), 1)
  });
});

router.get("/:id", function (req, res) {
  const row = db.prepare(SELECT_ITEM + "WHERE i.id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Item not found" });
  res.json(withStatus(row));
});

const createItem = db.transaction(function (it, userId) {
  const r = db.prepare(
    "INSERT INTO items (sku, name, category_id, supplier_id, price, quantity, reorder_level) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(it.sku, it.name, it.category_id, it.supplier_id, it.price, it.quantity, it.reorder_level);
  if (it.quantity > 0) {
    db.prepare(
      "INSERT INTO stock_movements (item_id, user_id, type, quantity, note) VALUES (?, ?, 'in', ?, 'Opening stock')"
    ).run(r.lastInsertRowid, userId, it.quantity);
  }
  return r.lastInsertRowid;
});

router.post("/", canEdit, function (req, res) {
  const it = readItem(req.body);
  const err = validate(it, true);
  if (err) return res.status(400).json({ error: err });
  try {
    const id = createItem(it, req.user.id);
    logActivity(req.user.id, "created", "item", id, it.sku + " - " + it.name);
    const row = db.prepare(SELECT_ITEM + "WHERE i.id = ?").get(id);
    res.status(201).json(withStatus(row));
  } catch (e) {
    handleDbError(e, res);
  }
});

router.put("/:id", canEdit, function (req, res) {
  const it = readItem(req.body);
  const err = validate(it, false);
  if (err) return res.status(400).json({ error: err });
  try {
    const result = db.prepare(
      "UPDATE items SET sku = ?, name = ?, category_id = ?, supplier_id = ?, price = ?, reorder_level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(it.sku, it.name, it.category_id, it.supplier_id, it.price, it.reorder_level, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: "Item not found" });
    logActivity(req.user.id, "updated", "item", Number(req.params.id), it.sku + " - " + it.name);
    const row = db.prepare(SELECT_ITEM + "WHERE i.id = ?").get(req.params.id);
    res.json(withStatus(row));
  } catch (e) {
    handleDbError(e, res);
  }
});

const removeItem = db.transaction(function (id) {
  db.prepare("DELETE FROM notifications WHERE item_id = ?").run(id);
  db.prepare("DELETE FROM stock_movements WHERE item_id = ?").run(id);
  return db.prepare("DELETE FROM items WHERE id = ?").run(id);
});

router.delete("/:id", requireRole("admin"), function (req, res) {
  const item = db.prepare("SELECT sku, name FROM items WHERE id = ?").get(req.params.id);
  if (!item) return res.status(404).json({ error: "Item not found" });
  removeItem(req.params.id);
  logActivity(req.user.id, "deleted", "item", Number(req.params.id), item.sku + " - " + item.name);
  res.json({ ok: true });
});

module.exports = router;
