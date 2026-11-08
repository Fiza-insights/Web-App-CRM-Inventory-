import { useEffect, useState } from "react";
import { api } from "../api.js";

function fmt(s) {
  return new Date(s.replace(" ", "T") + "Z").toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function Movements() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(function () {
    api("/stock/movements?limit=10&page=" + page)
      .then(function (d) { setResult(d); setError(""); })
      .catch(function (e) { setError(e.message); });
  }, [page]);

  const rows = result ? result.movements : [];
  const from = result && result.total ? (result.page - 1) * result.limit + 1 : 0;
  const to = result ? Math.min(result.page * result.limit, result.total) : 0;

  return (
    <div className="card pad">
      {error && <div className="error">{error}</div>}

      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Item</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Note</th>
              <th>By</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(function (m) {
              const isIn = m.type === "in";
              return (
                <tr key={m.id}>
                  <td className="muted">{fmt(m.created_at)}</td>
                  <td>{m.item_name} <span className="muted">({m.sku})</span></td>
                  <td><span className={"badge " + (isIn ? "mv-in" : "mv-out")}>{isIn ? "Stock in" : "Stock out"}</span></td>
                  <td className={isIn ? "qty-in" : "qty-out"}>{isIn ? "+" : "-"}{m.quantity}</td>
                  <td className="muted">{m.note || "-"}</td>
                  <td>{m.user_name || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {result && rows.length === 0 && <p className="muted" style={{ padding: 16 }}>No stock movements yet.</p>}
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
