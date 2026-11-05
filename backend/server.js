try { process.loadEnvFile(); } catch (e) { console.log("No .env file found"); }

const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", function (req, res) {
  const row = db.prepare("SELECT COUNT(*) AS tables_count FROM sqlite_master WHERE type = 'table'").get();
  res.json({ status: "ok", app: "StockSense API", tables: row.tables_count });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/suppliers", require("./routes/suppliers"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, function () {
  console.log("StockSense API running on http://localhost:" + PORT);
});



