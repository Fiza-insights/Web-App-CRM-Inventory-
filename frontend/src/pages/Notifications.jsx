import { useEffect, useState } from "react";
import { Bell, CheckCheck, Check } from "lucide-react";
import { api } from "../api.js";

function fmt(s) {
  return new Date(s.replace(" ", "T") + "Z").toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function Notifications() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  function load() {
    api("/notifications")
      .then(function (d) { setData(d); setError(""); })
      .catch(function (e) { setError(e.message); });
  }

  useEffect(function () { load(); }, []);

  function changed() {
    load();
    window.dispatchEvent(new Event("notifications-changed"));
  }

  function markRead(id) {
    api("/notifications/" + id + "/read", { method: "PUT" })
      .then(changed)
      .catch(function (e) { setError(e.message); });
  }

  function markAll() {
    api("/notifications/read-all", { method: "PUT" })
      .then(changed)
      .catch(function (e) { setError(e.message); });
  }

  const all = data ? data.notifications : [];
  const list = filter === "unread" ? all.filter(function (n) { return !n.is_read; }) : all;
  const unread = data ? data.unread_count : 0;

  return (
    <div className="card pad">
      <div className="page-head">
        <div className="tabs">
          <button className={"tab" + (filter === "all" ? " active" : "")} onClick={function () { setFilter("all"); }}>All</button>
          <button className={"tab" + (filter === "unread" ? " active" : "")} onClick={function () { setFilter("unread"); }}>Unread ({unread})</button>
        </div>
        <button className="btn" disabled={unread === 0} onClick={markAll}>
          <CheckCheck size={16} style={{ verticalAlign: "middle" }} /> Mark all as read
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {data && list.length === 0 && <p className="muted">Nothing here. You are all caught up.</p>}

      <div>
        {list.map(function (n) {
          const isOut = n.message.indexOf("out of stock") !== -1;
          const cls = "notif" + (n.is_read ? "" : " unread") + (isOut ? " out" : "");
          return (
            <div className={cls} key={n.id}>
              <span className="notif-icon"><Bell size={18} /></span>
              <div className="notif-body">
                <div className="notif-msg">{n.message}</div>
                <div className="muted notif-meta">{n.item_name || "Item removed"} - {fmt(n.created_at)}</div>
              </div>
              {!n.is_read && (
                <button className="btn small" onClick={function () { markRead(n.id); }}>
                  <Check size={14} style={{ verticalAlign: "middle" }} /> Mark read
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
