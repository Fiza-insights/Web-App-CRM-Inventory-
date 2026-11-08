import { useEffect } from "react";

document.documentElement.setAttribute("data-theme", "glass");

export default function ThemeSwitch() {
  useEffect(function () {
    document.documentElement.setAttribute("data-theme", "glass");
  }, []);
  return null;
}
