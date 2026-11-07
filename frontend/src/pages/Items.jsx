import { useEffect, useState } from "react";
import { Search, ChevronUp, ChevronDown, Plus, Pencil, Trash2, FilterX, ArrowLeftRight } from "lucide-react";
import { api, getUser } from "../api.js";
import ItemForm from "../components/ItemForm.jsx";
import StockForm from "../components/StockForm.jsx";

const LABEL = { in_stock: "In stock", low: "Low", out: "Out" };
const CLASS = { in_stock: "ok", low: "low", out: "out" };

function money(n) {
  return "Rs " + Number(n || 0).toLocaleString("en-PK");
}

export default function Items() {
  const user = getUser();
  const canEdit = user.role === "admin" || user.role === "manager";
  const canDelete = user.role === "admin";

  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("name");
  const [order, setOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [stockItem, setStockItem] = useState(null);

  useEffect(function () {
    api("/categories").then(setCategories).catch(function () {});
    api("/suppliers").then(setSuppliers).catch(function () {});
  }, []);

  useEffect(function () {
    const t = setTimeout(function () {
      setQuery(search);
      setPage(1);
    }, 300);
    return function () { clearTimeout(t); };
  }, [search]);

  useEffect(function () {
    const p = new URLSearchParams({ page: page, limit: 10, sort: sort, order: order });
    if (query) p.set("search", query);
    if (categoryId) p.set("category_id", categoryId);
    if (status) p.set("status", status);
    api("/items?" + p.toString())
      .then(function (d) { setResult(d); setError(""); })
      .catch(function (e) { setError(e.message); });
  }, [query, categoryId, status, sort, order, page, refresh]);

  function reload() {
    setRefresh(function (r) { return r + 1; });
  }

  function toggleSort(column) {
    if (sort === column) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(column);
      setOrder("asc");
    }
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setQuery("");
    setCategoryId("");
    setStatus("");
    setPage(1);
  }

  function openNew() {
    setEditItem(null);
    setFormOpen(true);
  }

  function openEdit(it) {
    setEditItem(it);
    setFormOpen(true);
  }

  function remove(it) {
    if (!window.confirm("Delete " + it.name + "? Its stock history will be deleted too.")) return;
    api("/items/" + it.id, { method: "DELETE" })
      .then(reload)
      .catch(function (e) { setError(e.message); });
  }

  function header(column, label) {
    const active = sort === column;
    return (
      <th className="sortable" onClick={function () { toggleSort(column); }}>
        {label}
        {active && (order === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
      </th>
    );
  }

  const hasFilters = search || categoryId || status;
  const items = result ? result.items : [];
  const from = result && result.total ? (result.page - 1) * result.limit + 1 : 0;
  const to = result ? Math.min(result.page * result.limit, result.total) : 0;

  return (
    <div className="card pad">
      <div className="toolbar">
        <div className="search-box">
          <Search size={16} />
          <input placeholder="Search by name or SKU..." value={search} onChange={function (e) { setSearch(e.target.value); }} />
        </div>
        <select value={categoryId} onChange={function (e) { setCategoryId(e.target.value); setPage(1); }}>
          <option value="">All categories</option>
          {categories.map(function (c) { return <option key={c.id} value={c.id}>{c.name}</option>; })}
        </select>
        <select value={status} onChange={function (e) { setStatus(e.target.value); setPage(1); }}>
          <option value="">All status</option>
          <option value="in_stock">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
        {hasFilters && (
          <button className="btn" onClick={clearFilters}><FilterX size={15} style={{ verticalAlign: "middle" }} /> Clear filters</button>
        )}
        {canEdit && (
          <button className="btn accent" onClick={openNew}><Plus size={16} style={{ verticalAlign: "middle" }} /> Add item</button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              {header("sku", "SKU")}
              {header("name", "Name")}
              <th>Category</th>
              <th>Supplier</th>
              {header("price", "Price")}
              {header("quantity", "Qty")}
              <th>Status</th>
              {canEdit && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items.map(function (it) {
              return (
                <tr key={it.id}>
                  <td className="muted">{it.sku}</td>
                  <td>{it.name}</td>
                  <td>{it.category_name || "-"}</td>
                  <td className="muted">{it.supplier_name || "-"}</td>
                  <td>{money(it.price)}</td>
                  <td>{it.quantity}</td>
                  <td><span className={"badge " + CLASS[it.status]}>{LABEL[it.status]}</span></td>
                  {canEdit && (
                    <td>
                      <div className="row-actions">
                        <button className="row-btn" title="Stock in / out" onClick={function () { setStockItem(it); }}><ArrowLeftRight size={15} /></button>
                        <button className="row-btn" title="Edit" onClick={function () { openEdit(it); }}><Pencil size={15} /></button>
                        {canDelete && (
                          <button className="row-btn danger" title="Delete" onClick={function () { remove(it); }}><Trash2 size={15} /></button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {result && items.length === 0 && <p className="muted" style={{ padding: 16 }}>No items match your search.</p>}
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

      {stockItem && (<StockForm item={stockItem} onClose={function () { setStockItem(null); }} onDone={function () { setStockItem(null); reload(); }} />)}
      {formOpen && (
        <ItemForm
          item={editItem}
          categories={categories}
          suppliers={suppliers}
          onClose={function () { setFormOpen(false); }}
          onSaved={function () { setFormOpen(false); reload(); }}
        />
      )}
    </div>
  );
}

