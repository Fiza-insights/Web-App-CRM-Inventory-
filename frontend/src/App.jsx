import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Layout from "./components/Layout.jsx";
import { getToken } from "./api.js";

function Protected(props) {
  return getToken() ? props.children : <Navigate to="/login" replace />;
}

function Soon(props) {
  return (
    <div className="card pad">
      <h2>{props.title}</h2>
      <p className="muted">This page is coming in the next steps.</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/items" element={<Soon title="Items" />} />
        <Route path="/movements" element={<Soon title="Stock Movements" />} />
        <Route path="/categories" element={<Soon title="Categories" />} />
        <Route path="/suppliers" element={<Soon title="Suppliers" />} />
        <Route path="/activity" element={<Soon title="Activity Log" />} />
        <Route path="/notifications" element={<Soon title="Notifications" />} />
        <Route path="/users" element={<Soon title="Users" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
