import { useEffect, useState } from "react";
import { api } from "../api.js";

const ACTION_CLASS = {
  "created": "act-green",
  "updated": "act-blue",
  "deleted": "act-red",
  "stock in": "act-green",
  "stock out": "act-amber"
};

function fmt(s) {
  return new Date(s.replace(" ", "T") + "Z").toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function Activity() {
  const [entity, setEntity] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(function () {
    const p = new URLSearchParams({ page: page, limit: 10 });
    if (entity) p.set("entity", entity);
    api("/activity?" + p.toString())
      .then(function (d) { setResult(d); setError(""); })
      .catch(function (e) { setError(e.message); });
  }, [entity, page]);

  const rows = result ? result.entries : [];
  const from = result && result.total ? (result.page - 1) * result.limit + 1 : 0;
  const to = result ? Math.min(result.page * result.limit, result.total) : 0;

  return (
    <div className="card pad">
      <div className="toolbar">
        <select value={entity} onChange={function (e) { setEntity(e.target.value); setPage(1); }}>
          <option value="">All activity</option>
          <option value="item">Items</option>
          <option value="category">Categories</option>
          <option value="supplier">Suppliers</option>
          <option value="user">Users</option>
        </select>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Action</th>
              <th>On</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(function (a) {
              return (
                <tr key={a.id}>
                  <td className="muted">{fmt(a.created_at)}</td>
                  <td>{a.user_name || "System"}</td>
                  <td><span className={"badge " + (ACTION_CLASS[a.action] || "act-blue")}>{a.action}</span></td>
                  <td style={{ textTransform: "capitalize" }}>{a.entity}</td>
                  <td className="muted">{a.details || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {result && rows.length === 0 && <p className="muted" style={{ padding: 16 }}>No activity found.</p>}
      </div>

      {result && (
        <div className="pager">
          <span className="muted">Showing {from}-{to} of {result.total}</span>
          <div className="pager-btns">
            <button className="btn small" disabled={result.page <= 1} onClick={function () { setPage(page - 1); }}>Previous</button>
            <span className="muted">Page {result.page} of {result.total_pages}</span>
            <button className="btn small" disabled={result.page >= result.total_pages} onClick={function () { setPage(page + 1); }}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
