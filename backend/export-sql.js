const db = require("./db");
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "database");
fs.mkdirSync(dir, { recursive: true });
fs.copyFileSync(path.join(__dirname, "schema.sql"), path.join(dir, "schema.sql"));

function q(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  return "'" + String(v).replace(/'/g, "''") + "'";
}

const tables = ["users", "categories", "suppliers", "items", "stock_movements", "activity_log", "notifications"];
let out = "-- StockSense dummy seed data\nPRAGMA foreign_keys = OFF;\nBEGIN TRANSACTION;\n";
let count = 0;
for (const t of tables) {
  const rows = db.prepare("SELECT * FROM " + t).all();
  for (const r of rows) {
    const cols = Object.keys(r);
    out += "INSERT INTO " + t + " (" + cols.join(", ") + ") VALUES (" + cols.map(function (c) { return q(r[c]); }).join(", ") + ");\n";
    count++;
  }
}
out += "COMMIT;\nPRAGMA foreign_keys = ON;\n";
fs.writeFileSync(path.join(dir, "seed.sql"), out);
console.log("Done. " + count + " rows written to database/seed.sql");
