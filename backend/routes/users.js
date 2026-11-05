const express = require("express");
const db = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticate, requireRole("admin"), function (req, res) {
  const users = db.prepare("SELECT id, name, email, role, created_at FROM users ORDER BY id").all();
  res.json(users);
});

module.exports = router;
