const bcrypt = require("bcryptjs");
const db = require("./db");

const users = [
  { name: "Fiza Saleem", email: "admin@stocksense.test", password: "Admin@123", role: "admin" },
  { name: "Bilal Manager", email: "manager@stocksense.test", password: "Manager@123", role: "manager" },
  { name: "Sara User", email: "user@stocksense.test", password: "User@123", role: "user" }
];

const categories = ["Electronics", "Office Supplies", "Furniture", "Grocery", "Cleaning"];

const suppliers = [
  { name: "Tech Distributors", email: "sales@techdist.test", phone: "0300-1234567" },
  { name: "Office Hub", email: "orders@officehub.test", phone: "0321-5550101" },
  { name: "Home Comforts", email: "info@homecomforts.test", phone: "0333-5550202" },
  { name: "Fresh Wholesale", email: "supply@freshwholesale.test", phone: "0345-5550303" },
  { name: "CleanPro Traders", email: "sales@cleanpro.test", phone: "0301-5550404" }
];

// sku, name, category, supplier, price, quantity, reorder level
const items = [
  ["ELE-101", "Wireless Mouse", "Electronics", "Tech Distributors", 1800, 45, 10],
  ["ELE-102", "Mechanical Keyboard", "Electronics", "Tech Distributors", 7500, 30, 8],
  ["ELE-103", "USB-C Hub", "Electronics", "Tech Distributors", 4200, 22, 8],
  ["ELE-104", "27-inch Monitor", "Electronics", "Tech Distributors", 52000, 9, 5],
  ["ELE-105", "Webcam HD", "Electronics", "Tech Distributors", 6500, 3, 5],
  ["ELE-106", "Bluetooth Headphones", "Electronics", "Tech Distributors", 9800, 18, 6],
  ["ELE-107", "External SSD 1TB", "Electronics", "Tech Distributors", 21000, 0, 4],
  ["ELE-108", "Power Bank 20000mAh", "Electronics", "Tech Distributors", 5500, 27, 8],
  ["ELE-109", "HDMI Cable 2m", "Electronics", "Tech Distributors", 900, 80, 20],
  ["ELE-110", "Wi-Fi Router", "Electronics", "Tech Distributors", 8800, 12, 5],
  ["ELE-111", "Laptop Stand", "Electronics", "Tech Distributors", 3200, 4, 6],

  ["OFF-201", "A4 Paper Ream", "Office Supplies", "Office Hub", 1250, 120, 30],
  ["OFF-202", "Ball Pen Box (50)", "Office Supplies", "Office Hub", 650, 60, 15],
  ["OFF-203", "Stapler Heavy Duty", "Office Supplies", "Office Hub", 850, 25, 8],
  ["OFF-204", "Sticky Notes Pack", "Office Supplies", "Office Hub", 300, 90, 20],
  ["OFF-205", "Whiteboard Marker Set", "Office Supplies", "Office Hub", 720, 14, 10],
  ["OFF-206", "File Folder Pack (10)", "Office Supplies", "Office Hub", 540, 7, 10],
  ["OFF-207", "Desk Organizer", "Office Supplies", "Office Hub", 1500, 16, 6],
  ["OFF-208", "Printer Ink Black", "Office Supplies", "Office Hub", 3800, 0, 5],
  ["OFF-209", "Highlighter Set", "Office Supplies", "Office Hub", 480, 48, 12],
  ["OFF-210", "Paper Clips Box", "Office Supplies", "Office Hub", 150, 200, 40],
  ["OFF-211", "Notebook A5", "Office Supplies", "Office Hub", 220, 75, 25],

  ["FUR-301", "Ergonomic Office Chair", "Furniture", "Home Comforts", 28500, 8, 3],
  ["FUR-302", "Standing Desk", "Furniture", "Home Comforts", 46000, 5, 3],
  ["FUR-303", "Bookshelf 5-Tier", "Furniture", "Home Comforts", 14500, 6, 3],
  ["FUR-304", "Filing Cabinet", "Furniture", "Home Comforts", 18500, 2, 3],
  ["FUR-305", "Meeting Table", "Furniture", "Home Comforts", 38000, 3, 2],
  ["FUR-306", "Visitor Chair", "Furniture", "Home Comforts", 9500, 20, 6],
  ["FUR-307", "Desk Lamp", "Furniture", "Home Comforts", 3200, 35, 10],
  ["FUR-308", "Footrest", "Furniture", "Home Comforts", 2800, 11, 5],
  ["FUR-309", "Coat Stand", "Furniture", "Home Comforts", 4200, 9, 4],
  ["FUR-310", "Storage Cabinet", "Furniture", "Home Comforts", 22000, 0, 2],
  ["FUR-311", "Floor Mat", "Furniture", "Home Comforts", 2500, 14, 5],

  ["GRO-401", "Tea Bags Box (100)", "Grocery", "Fresh Wholesale", 650, 55, 15],
  ["GRO-402", "Coffee Beans 1kg", "Grocery", "Fresh Wholesale", 3200, 20, 8],
  ["GRO-403", "Sugar 5kg", "Grocery", "Fresh Wholesale", 780, 40, 15],
  ["GRO-404", "Cooking Oil 5L", "Grocery", "Fresh Wholesale", 2900, 18, 10],
  ["GRO-405", "Basmati Rice 10kg", "Grocery", "Fresh Wholesale", 3400, 25, 10],
  ["GRO-406", "Bottled Water Pack (12)", "Grocery", "Fresh Wholesale", 600, 150, 40],
  ["GRO-407", "Biscuits Carton", "Grocery", "Fresh Wholesale", 1800, 9, 10],
  ["GRO-408", "Milk Powder 1kg", "Grocery", "Fresh Wholesale", 2100, 13, 8],
  ["GRO-409", "Juice Pack (12)", "Grocery", "Fresh Wholesale", 1900, 0, 8],
  ["GRO-410", "Salt 1kg", "Grocery", "Fresh Wholesale", 90, 70, 20],
  ["GRO-411", "Instant Noodles Carton", "Grocery", "Fresh Wholesale", 2200, 17, 8],

  ["CLN-501", "Floor Cleaner 5L", "Cleaning", "CleanPro Traders", 1700, 24, 8],
  ["CLN-502", "Hand Wash 500ml", "Cleaning", "CleanPro Traders", 350, 60, 20],
  ["CLN-503", "Tissue Box Carton", "Cleaning", "CleanPro Traders", 2600, 15, 6],
  ["CLN-504", "Disinfectant Spray", "Cleaning", "CleanPro Traders", 650, 38, 12],
  ["CLN-505", "Broom and Dustpan Set", "Cleaning", "CleanPro Traders", 900, 12, 5],
  ["CLN-506", "Dishwashing Liquid 750ml", "Cleaning", "CleanPro Traders", 420, 5, 10],
  ["CLN-507", "Garbage Bags Roll", "Cleaning", "CleanPro Traders", 380, 66, 20],
  ["CLN-508", "Mop Bucket Set", "Cleaning", "CleanPro Traders", 3500, 8, 4],
  ["CLN-509", "Glass Cleaner", "Cleaning", "CleanPro Traders", 480, 29, 10],
  ["CLN-510", "Sanitizer 5L", "Cleaning", "CleanPro Traders", 2800, 4, 6],
  ["CLN-511", "Microfiber Cloth Pack", "Cleaning", "CleanPro Traders", 600, 33, 10]
];

function run() {
  users.forEach(function (u) {
    db.prepare(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET name = excluded.name, password_hash = excluded.password_hash, role = excluded.role"
    ).run(u.name, u.email, bcrypt.hashSync(u.password, 10), u.role);
  });

  const adminId = db.prepare("SELECT id FROM users WHERE email = ?").get("admin@stocksense.test").id;
  const managerId = db.prepare("SELECT id FROM users WHERE email = ?").get("manager@stocksense.test").id;

  categories.forEach(function (name) {
    db.prepare("INSERT OR IGNORE INTO categories (name) VALUES (?)").run(name);
  });

  suppliers.forEach(function (s) {
    const exists = db.prepare("SELECT id FROM suppliers WHERE name = ?").get(s.name);
    if (!exists) {
      db.prepare("INSERT INTO suppliers (name, email, phone) VALUES (?, ?, ?)").run(s.name, s.email, s.phone);
    }
  });

  let newItems = 0;
  let newMovements = 0;
  let newNotifications = 0;

  items.forEach(function (row, i) {
    const sku = row[0], name = row[1], qty = row[5], reorder = row[6];
    const categoryId = db.prepare("SELECT id FROM categories WHERE name = ?").get(row[2]).id;
    const supplierId = db.prepare("SELECT id FROM suppliers WHERE name = ?").get(row[3]).id;

    const result = db.prepare(
      "INSERT OR IGNORE INTO items (sku, name, category_id, supplier_id, price, quantity, reorder_level) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(sku, name, categoryId, supplierId, row[4], qty, reorder);
    if (result.changes === 0) return;

    newItems++;
    const itemId = result.lastInsertRowid;

    // history: restocks on days 5-4, sales on days 3-0
    const ins = [];
    const outs = [];
    let sumIn = 0;
    let sumOut = 0;
    for (let d = 5; d >= 4; d--) {
      if ((i * 2 + d) % 5 === 0) { const q = 3 + (i % 5); ins.push({ day: d, qty: q }); sumIn += q; }
    }
    for (let d = 3; d >= 0; d--) {
      if ((i + d) % 3 === 0) { const q = (i % 4) + 1; outs.push({ day: d, qty: q }); sumOut += q; }
    }
    let opening = qty + sumOut - sumIn;
    if (opening < 0) { ins.length = 0; sumIn = 0; opening = qty + sumOut; }

    const addMove = db.prepare(
      "INSERT INTO stock_movements (item_id, user_id, type, quantity, note, created_at) VALUES (?, ?, ?, ?, ?, datetime('now', ?))"
    );
    if (opening > 0) { addMove.run(itemId, adminId, "in", opening, "Opening stock", "-7 days"); newMovements++; }
    ins.forEach(function (m) { addMove.run(itemId, managerId, "in", m.qty, "Restock from supplier", "-" + m.day + " days"); newMovements++; });
    outs.forEach(function (m) { addMove.run(itemId, managerId, "out", m.qty, "Sold / issued", "-" + m.day + " days"); newMovements++; });

    db.prepare("INSERT INTO activity_log (user_id, action, entity, entity_id, details, created_at) VALUES (?, 'created', 'item', ?, ?, datetime('now', '-7 days'))")
      .run(adminId, itemId, sku + " - " + name);

    if (qty <= reorder) {
      const message = qty === 0 ? name + " is out of stock" : name + " is low on stock (" + qty + " left)";
      db.prepare("INSERT INTO notifications (item_id, message) VALUES (?, ?)").run(itemId, message);
      newNotifications++;
    }
  });

  console.log("New items:", newItems, "| movements:", newMovements, "| notifications:", newNotifications);
}

db.transaction(run)();

const counts = {
  users: db.prepare("SELECT COUNT(*) AS n FROM users").get().n,
  categories: db.prepare("SELECT COUNT(*) AS n FROM categories").get().n,
  suppliers: db.prepare("SELECT COUNT(*) AS n FROM suppliers").get().n,
  items: db.prepare("SELECT COUNT(*) AS n FROM items").get().n
};
console.log("Totals ->", JSON.stringify(counts));
