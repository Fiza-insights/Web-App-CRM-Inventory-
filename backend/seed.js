const bcrypt = require("bcryptjs");
const db = require("./db");

const users = [
  { name: "Fiza Saleem", email: "admin@stocksense.test", password: "Admin@123", role: "admin" },
  { name: "Bilal Manager", email: "manager@stocksense.test", password: "Manager@123", role: "manager" },
  { name: "Sara User", email: "user@stocksense.test", password: "User@123", role: "user" }
];

const insert = db.prepare(
  "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET name = excluded.name, password_hash = excluded.password_hash, role = excluded.role"
);

users.forEach(function (u) {
  insert.run(u.name, u.email, bcrypt.hashSync(u.password, 10), u.role);
});

const count = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
console.log("Users in database:", count);

