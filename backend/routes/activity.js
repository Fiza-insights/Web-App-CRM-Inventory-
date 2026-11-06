const express = require("express");
const db = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate, requireRole("admin", "manager"));

router.get("/", function (req, res) {
  const where = [];
  const params = [];
  if (req.query.entity) {
    where.push("a.entity = ?");
    params.push(req.query.entity);
  }
  const whereSql = where.length ? "WHERE " + where.join(" AND ") + " " : "";
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  const total = db.prepare("SELECT COUNT(*) AS n FROM activity_log a " + whereSql).get(...params).n;
  const rows = db.prepare(
    "SELECT a.id, a.action, a.entity, a.entity_id, a.details, a.created_at, u.name AS user_name " +
    "FROM activity_log a LEFT JOIN users u ON u.id = a.user_id " +
    whereSql + "ORDER BY a.id DESC LIMIT ? OFFSET ?"
  ).all(...params, limit, (page - 1) * limit);

  res.json({ entries: rows, page: page, limit: limit, total: total, total_pages: Math.max(Math.ceil(total / limit), 1) });
});

module.exports = router;
