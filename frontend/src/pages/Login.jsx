import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, saveLogin } from "../api.js";

const DEMO = [
  { label: "Admin", email: "admin@stocksense.test", password: "Admin@123" },
  { label: "Manager", email: "manager@stocksense.test", password: "Manager@123" },
  { label: "User", email: "user@stocksense.test", password: "User@123" }
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api("/auth/login", { method: "POST", body: { email: email, password: password } });
      saveLogin(data);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={handleSubmit}>
        <h1 className="brand">StockSense</h1>
        <p className="muted">Sign in to manage your inventory</p>

        <label>Email</label>
        <input type="email" value={email} onChange={function (e) { setEmail(e.target.value); }} placeholder="you@example.com" required />

        <label>Password</label>
        <input type="password" value={password} onChange={function (e) { setPassword(e.target.value); }} placeholder="Your password" required />

        {error && <div className="error">{error}</div>}

        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <div className="demo">
          <span className="muted">Demo accounts:</span>
          {DEMO.map(function (d) {
            return (
              <button type="button" key={d.label} className="btn small" onClick={function () { setEmail(d.email); setPassword(d.password); }}>
                {d.label}
              </button>
            );
          })}
        </div>
      </form>
    </div>
  );
}
