const express = require("express");
const db = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");
const logActivity = require("../utils/activity");

const router = express.Router();

router.use(authenticate);

const moveStock = db.transaction(function (itemId, type, qty, note, userId) {
  const item = db.prepare("SELECT * FROM items WHERE id = ?").get(itemId);
  if (!item) return { error: "Item not found", status: 404 };
  if (type === "out" && qty > item.quantity) {
    return { error: "Not enough stock. Available: " + item.quantity, status: 400 };
  }

  const newQty = type === "in" ? item.quantity + qty : item.quantity - qty;

  db.prepare("UPDATE items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(newQty, itemId);
  db.prepare(
    "INSERT INTO stock_movements (item_id, user_id, type, quantity, note) VALUES (?, ?, ?, ?, ?)"
  ).run(itemId, userId, type, qty, note);

  if (newQty <= item.reorder_level) {
    const message = newQty === 0
      ? item.name + " is out of stock"
      : item.name + " is low on stock (" + newQty + " left)";
    const existing = db.prepare("SELECT id FROM notifications WHERE item_id = ? AND is_read = 0").get(itemId);
    if (existing) {
      db.prepare("UPDATE notifications SET message = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?").run(message, existing.id);
    } else {
      db.prepare("INSERT INTO notifications (item_id, message) VALUES (?, ?)").run(itemId, message);
    }
  } else {
    db.prepare("UPDATE notifications SET is_read = 1 WHERE item_id = ? AND is_read = 0").run(itemId);
  }

  logActivity(userId, type === "in" ? "stock in" : "stock out", "item", itemId, qty + " units - " + item.name);
  return { item_id: itemId, type: type, quantity: qty, new_quantity: newQty };
});

router.post("/move", requireRole("admin", "manager"), function (req, res) {
  const b = req.body || {};
  const itemId = Number(b.item_id);
  const qty = Number(b.quantity);
  const note = String(b.note || "").trim() || null;

  if (!Number.isInteger(itemId) || itemId < 1) return res.status(400).json({ error: "item_id is required" });
  if (b.type !== "in" && b.type !== "out") return res.status(400).json({ error: "type must be in or out" });
  if (!Number.isInteger(qty) || qty < 1) return res.status(400).json({ error: "Quantity must be a whole number, 1 or more" });

  const result = moveStock(itemId, b.type, qty, note, req.user.id);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(201).json(result);
});

router.get("/movements", function (req, res) {
  const where = [];
  const params = [];
  if (req.query.item_id) {
    where.push("m.item_id = ?");
    params.push(req.query.item_id);
  }
  const whereSql = where.length ? "WHERE " + where.join(" AND ") + " " : "";
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  const total = db.prepare("SELECT COUNT(*) AS n FROM stock_movements m " + whereSql).get(...params).n;
  const rows = db.prepare(
    "SELECT m.id, m.item_id, i.name AS item_name, i.sku, m.type, m.quantity, m.note, m.created_at, u.name AS user_name " +
    "FROM stock_movements m JOIN items i ON i.id = m.item_id LEFT JOIN users u ON u.id = m.user_id " +
    whereSql + "ORDER BY m.id DESC LIMIT ? OFFSET ?"
  ).all(...params, limit, (page - 1) * limit);

  res.json({ movements: rows, page: page, limit: limit, total: total, total_pages: Math.max(Math.ceil(total / limit), 1) });
});

module.exports = router;
