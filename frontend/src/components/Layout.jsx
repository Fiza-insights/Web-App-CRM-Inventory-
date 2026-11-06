import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ArrowLeftRight, Tags, Truck, ScrollText, Bell, Users, LogOut, Boxes } from "lucide-react";
import { api, getUser, logout } from "../api.js";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "user"] },
  { to: "/items", label: "Items", icon: Package, roles: ["admin", "manager", "user"] },
  { to: "/movements", label: "Stock Movements", icon: ArrowLeftRight, roles: ["admin", "manager", "user"] },
  { to: "/categories", label: "Categories", icon: Tags, roles: ["admin", "manager", "user"] },
  { to: "/suppliers", label: "Suppliers", icon: Truck, roles: ["admin", "manager", "user"] },
  { to: "/activity", label: "Activity Log", icon: ScrollText, roles: ["admin", "manager"] },
  { to: "/notifications", label: "Notifications", icon: Bell, roles: ["admin", "manager", "user"] },
  { to: "/users", label: "Users", icon: Users, roles: ["admin"] }
];

export default function Layout() {
  const user = getUser();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(function () {
    api("/notifications").then(function (d) { setUnread(d.unread_count); }).catch(function () {});
  }, [location.pathname]);

  const links = NAV.filter(function (n) { return n.roles.indexOf(user.role) !== -1; });
  const current = NAV.find(function (n) { return n.to === location.pathname; });
  const title = current ? current.label : "StockSense";

  return (
    <div className="app">
      <aside className="card sidebar">
        <div className="logo">
          <span className="logo-mark"><Boxes size={20} /></span>
          StockSense
        </div>
        {links.map(function (n) {
          const Icon = n.icon;
          return (
            <NavLink key={n.to} to={n.to} end={n.to === "/"} className={function (s) { return "nav-link" + (s.isActive ? " active" : ""); }}>
              <Icon size={18} />
              {n.label}
            </NavLink>
          );
        })}
        <div className="sidebar-foot">Inventory Management System</div>
      </aside>

      <div className="main">
        <header className="card topbar">
          <h1>{title}</h1>
          <div className="topbar-right">
            <NavLink to="/notifications" className="bell" title="Notifications">
              <Bell size={18} />
              {unread > 0 && <span className="dot">{unread}</span>}
            </NavLink>
            <div className="user-chip">
              <div className="avatar">{user.name.charAt(0)}</div>
              <div>
                <div className="user-name">{user.name}</div>
                <div className="user-role">{user.role}</div>
              </div>
            </div>
            <button className="icon-btn" title="Logout" onClick={function () { logout(); window.location.href = "/login"; }}>
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
