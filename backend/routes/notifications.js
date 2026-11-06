const express = require("express");
const db = require("../db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.get("/", function (req, res) {
  const rows = db.prepare(
    "SELECT n.id, n.item_id, i.name AS item_name, n.message, n.is_read, n.created_at " +
    "FROM notifications n LEFT JOIN items i ON i.id = n.item_id ORDER BY n.id DESC LIMIT 50"
  ).all();
  const unread = db.prepare("SELECT COUNT(*) AS n FROM notifications WHERE is_read = 0").get().n;
  res.json({ unread_count: unread, notifications: rows });
});

router.put("/read-all", function (req, res) {
  const result = db.prepare("UPDATE notifications SET is_read = 1 WHERE is_read = 0").run();
  res.json({ marked: result.changes });
});

router.put("/:id/read", function (req, res) {
  const result = db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Notification not found" });
  res.json({ ok: true });
});

module.exports = router;
