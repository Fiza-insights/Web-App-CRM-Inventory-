const express = require("express");
const db = require("../db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.get("/", function (req, res) {
  const totals = db.prepare(
    "SELECT COUNT(*) AS total_items, " +
    "COALESCE(SUM(price * quantity), 0) AS stock_value, " +
    "COALESCE(SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END), 0) AS out_of_stock, " +
    "COALESCE(SUM(CASE WHEN quantity > 0 AND quantity <= reorder_level THEN 1 ELSE 0 END), 0) AS low_stock " +
    "FROM items"
  ).get();

  const categories = db.prepare("SELECT COUNT(*) AS n FROM categories").get().n;
  const suppliers = db.prepare("SELECT COUNT(*) AS n FROM suppliers").get().n;

  const byCategory = db.prepare(
    "SELECT COALESCE(c.name, 'Uncategorised') AS name, COUNT(i.id) AS items, COALESCE(SUM(i.quantity), 0) AS quantity " +
    "FROM items i LEFT JOIN categories c ON c.id = i.category_id GROUP BY c.id ORDER BY items DESC"
  ).all();

  const movements = db.prepare(
    "SELECT date(created_at) AS day, " +
    "SUM(CASE WHEN type = 'in' THEN quantity ELSE 0 END) AS stock_in, " +
    "SUM(CASE WHEN type = 'out' THEN quantity ELSE 0 END) AS stock_out " +
    "FROM stock_movements WHERE created_at >= date('now', '-6 days') " +
    "GROUP BY date(created_at) ORDER BY day"
  ).all();

  const lowItems = db.prepare(
    "SELECT id, sku, name, quantity, reorder_level FROM items WHERE quantity <= reorder_level ORDER BY quantity, name LIMIT 5"
  ).all();

  res.json({
    cards: {
      total_items: totals.total_items,
      stock_value: totals.stock_value,
      low_stock: totals.low_stock,
      out_of_stock: totals.out_of_stock,
      categories: categories,
      suppliers: suppliers
    },
    by_category: byCategory,
    movements_last_7_days: movements,
    lowest_stock_items: lowItems
  });
});

module.exports = router;
