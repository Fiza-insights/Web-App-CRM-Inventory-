const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");
const logActivity = require("../utils/activity");

const router = express.Router();
const ROLES = ["admin", "manager", "user"];

router.use(authenticate, requireRole("admin"));

router.get("/", function (req, res) {
  const users = db.prepare("SELECT id, name, email, role, created_at FROM users ORDER BY id").all();
  res.json(users);
});

router.post("/", function (req, res) {
  const b = req.body || {};
  const name = String(b.name || "").trim();
  const email = String(b.email || "").trim().toLowerCase();
  const password = String(b.password || "");
  const role = b.role || "user";

  if (!name || !email) return res.status(400).json({ error: "Name and email are required" });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
  if (ROLES.indexOf(role) === -1) return res.status(400).json({ error: "Invalid role" });

  try {
    const result = db.prepare(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)"
    ).run(name, email, bcrypt.hashSync(password, 10), role);
    logActivity(req.user.id, "created", "user", result.lastInsertRowid, name + " (" + role + ")");
    res.status(201).json({ id: result.lastInsertRowid, name: name, email: email, role: role });
  } catch (e) {
    if (e.code === "SQLITE_CONSTRAINT_UNIQUE") return res.status(409).json({ error: "Email already exists" });
    throw e;
  }
});

router.put("/:id", function (req, res) {
  const id = Number(req.params.id);
  const b = req.body || {};
  const name = String(b.name || "").trim();
  const role = b.role;
  const password = String(b.password || "");

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (!name) return res.status(400).json({ error: "Name is required" });
  if (ROLES.indexOf(role) === -1) return res.status(400).json({ error: "Invalid role" });
  if (password && password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
  if (id === req.user.id && role !== user.role) return res.status(400).json({ error: "You cannot change your own role" });

  if (password) {
    db.prepare("UPDATE users SET name = ?, role = ?, password_hash = ? WHERE id = ?").run(name, role, bcrypt.hashSync(password, 10), id);
  } else {
    db.prepare("UPDATE users SET name = ?, role = ? WHERE id = ?").run(name, role, id);
  }
  logActivity(req.user.id, "updated", "user", id, name + " (" + role + ")");
  res.json({ id: id, name: name, email: user.email, role: role });
});

const removeUser = db.transaction(function (id) {
  db.prepare("UPDATE stock_movements SET user_id = NULL WHERE user_id = ?").run(id);
  db.prepare("UPDATE activity_log SET user_id = NULL WHERE user_id = ?").run(id);
  return db.prepare("DELETE FROM users WHERE id = ?").run(id);
});

router.delete("/:id", function (req, res) {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: "You cannot delete your own account" });
  const user = db.prepare("SELECT name FROM users WHERE id = ?").get(id);
  if (!user) return res.status(404).json({ error: "User not found" });
  removeUser(id);
  logActivity(req.user.id, "deleted", "user", id, user.name);
  res.json({ ok: true });
});

module.exports = router;
