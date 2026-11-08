import { useState } from "react";

const THEMES = [
  { id: "emerald", label: "Emerald", color: "#22d68a" },
  { id: "olive", label: "Olive and Brass", color: "#d9a53a" },
  { id: "glass", label: "Glass", color: "#4fd8d0" }
];

function current() {
  try {
    return localStorage.getItem("theme") || "emerald";
  } catch (e) {
    return "emerald";
  }
}

export default function ThemeSwitch() {
  const [theme, setTheme] = useState(current());

  function pick(id) {
    setTheme(id);
    document.documentElement.setAttribute("data-theme", id);
    try {
      localStorage.setItem("theme", id);
    } catch (e) {}
  }

  return (
    <div className="theme-switch">
      {THEMES.map(function (t) {
        return (
          <button
            key={t.id}
            type="button"
            title={t.label}
            className={"theme-dot" + (theme === t.id ? " active" : "")}
            style={{ background: t.color }}
            onClick={function () { pick(t.id); }}
          />
        );
      })}
    </div>
  );
}
