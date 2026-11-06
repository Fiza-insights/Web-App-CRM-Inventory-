import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { Boxes, Wallet, AlertTriangle, PackageX, Bell } from "lucide-react";
import { api, getUser } from "../api.js";

const COLORS = ["#22d68a", "#19c3b1", "#3ba0ff", "#8b7bff", "#f5b942", "#ff5d6c"];
const GRID = "#143039";
const AXIS = "#7d98a1";
const TOOLTIP = { background: "#0b1a21", border: "1px solid #143039", borderRadius: 8, color: "#e4f1f2" };

function money(n) {
  return "Rs " + Number(n || 0).toLocaleString("en-PK");
}

function last7Days(rows) {
  const map = {};
  rows.forEach(function (r) { map[r.day] = r; });
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const r = map[key] || { stock_in: 0, stock_out: 0 };
    out.push({
      day: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      stock_in: r.stock_in,
      stock_out: r.stock_out
    });
  }
  return out;
}

function when(s) {
  return new Date(s.replace(" ", "T") + "Z").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function Dashboard() {
  const user = getUser();
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState("");

  useEffect(function () {
    api("/dashboard").then(setData).catch(function (e) { setError(e.message); });
    api("/notifications").then(function (d) {
      setAlerts(d.notifications.filter(function (n) { return !n.is_read; }).slice(0, 4));
    }).catch(function () {});
    if (user.role !== "user") {
      api("/activity?limit=5").then(function (d) { setActivity(d.entries); }).catch(function () {});
    }
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <p className="muted">Loading dashboard...</p>;

  const c = data.cards;
  const days = last7Days(data.movements_last_7_days);
  const healthy = c.total_items - c.low_stock - c.out_of_stock;
  const pct = c.total_items ? Math.round((healthy / c.total_items) * 100) : 0;
  const healthColor = pct >= 80 ? "#22d68a" : pct >= 60 ? "#f5b942" : "#ff5d6c";
  const healthLabel = pct >= 80 ? "Healthy" : pct >= 60 ? "Fair" : "Needs attention";

  const cards = [
    { label: "Total Items", value: c.total_items, sub: "across " + c.categories + " categories", icon: Boxes, tone: "teal" },
    { label: "Stock Value", value: money(c.stock_value), sub: "value of all stock on hand", icon: Wallet, tone: "green" },
    { label: "Low Stock", value: c.low_stock, sub: "need reordering soon", icon: AlertTriangle, tone: "amber" },
    { label: "Out of Stock", value: c.out_of_stock, sub: "restock immediately", icon: PackageX, tone: "red" }
  ];

  return (
    <div>
      <div className="kpis">
        {cards.map(function (k) {
          const Icon = k.icon;
          return (
            <div className={"card kpi tone-" + k.tone} key={k.label}>
              <div className="kpi-top">
                <span className="kpi-icon"><Icon size={18} /></span>
                <span className="kpi-label">{k.label}</span>
              </div>
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-sub">{k.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid two">
        <div className="card pad">
          <div className="card-title">Stock Movement (last 7 days)</div>
          <ResponsiveContainer width="100%" height={290}>
            <AreaChart data={days} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#19c3b1" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#19c3b1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d68a" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#22d68a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="day" stroke={AXIS} tickLine={false} axisLine={false} />
              <YAxis stroke={AXIS} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP} />
              <Legend />
              <Area type="monotone" dataKey="stock_in" name="Stock in" stroke="#19c3b1" strokeWidth={2} fill="url(#gIn)" />
              <Area type="monotone" dataKey="stock_out" name="Stock out" stroke="#22d68a" strokeWidth={2} fill="url(#gOut)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="stack">
          <div className="card pad">
            <div className="card-title">Items by Category</div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={data.by_category} dataKey="items" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={2} stroke="none">
                    {data.by_category.map(function (e, i) {
                      return <Cell key={e.name} fill={COLORS[i % COLORS.length]} />;
                    })}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
              <div className="center-label"><span className="muted">Total</span><b>{c.total_items}</b></div>
            </div>
            {data.by_category.map(function (e, i) {
              return (
                <div className="legend-row" key={e.name}>
                  <span><span className="dotc" style={{ background: COLORS[i % COLORS.length] }}></span>{e.name}</span>
                  <span className="muted">{e.items}</span>
                </div>
              );
            })}
          </div>

          <div className="card pad">
            <div className="card-title">Stock Health</div>
            <div className="gauge">
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={[{ v: pct }, { v: 100 - pct }]} dataKey="v" startAngle={180} endAngle={0} innerRadius="70%" outerRadius="100%" cy="90%" stroke="none">
                    <Cell fill={healthColor} />
                    <Cell fill="#143039" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="gauge-text">
                <div className="gauge-num">{pct}%</div>
                <div className="muted">{healthLabel}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid two">
        <div className="card pad">
          <div className="card-head">
            <div className="card-title">Lowest Stock Items</div>
            <Link className="link" to="/items">View all items</Link>
          </div>
          <table className="table">
            <thead>
              <tr><th>Item</th><th>SKU</th><th>Qty</th><th>Reorder at</th><th>Status</th></tr>
            </thead>
            <tbody>
              {data.lowest_stock_items.map(function (it) {
                const out = it.quantity === 0;
                return (
                  <tr key={it.id}>
                    <td>{it.name}</td>
                    <td className="muted">{it.sku}</td>
                    <td>{it.quantity}</td>
                    <td className="muted">{it.reorder_level}</td>
                    <td><span className={"badge " + (out ? "out" : "low")}>{out ? "Out" : "Low"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card pad">
          <div className="card-head">
            <div className="card-title">Reorder Alerts</div>
            <Link className="link" to="/notifications">View all</Link>
          </div>
          {alerts.length === 0 && <p className="muted">No new alerts.</p>}
          <ul className="list">
            {alerts.map(function (n) {
              return (
                <li key={n.id}>
                  <Bell size={16} color="#f5b942" style={{ marginTop: 2 }} />
                  <span>{n.message}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="grid two">
        <div className="card pad">
          <div className="card-title">Stock In vs Out (this week)</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={days} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="day" stroke={AXIS} tickLine={false} axisLine={false} />
              <YAxis stroke={AXIS} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Legend />
              <Bar dataKey="stock_in" name="Stock in" fill="#19c3b1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="stock_out" name="Stock out" fill="#22d68a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card pad">
          <div className="card-head">
            <div className="card-title">Recent Activity</div>
            {user.role !== "user" && <Link className="link" to="/activity">View all</Link>}
          </div>
          {user.role === "user" && <p className="muted">The activity log is available to admins and managers.</p>}
          <ul className="list">
            {activity.map(function (a) {
              return (
                <li key={a.id}>
                  <span><b>{a.user_name || "System"}</b> {a.action} {a.entity}<br /><span className="muted">{a.details}</span></span>
                  <span className="when">{when(a.created_at)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
