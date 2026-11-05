const db = require("../db");

function logActivity(userId, action, entity, entityId, details) {
  db.prepare(
    "INSERT INTO activity_log (user_id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)"
  ).run(userId, action, entity, entityId, details || null);
}

module.exports = logActivity;
