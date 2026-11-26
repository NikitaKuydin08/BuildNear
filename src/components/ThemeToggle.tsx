"use client";

import { useEffect, useState } from "react";

// A switch for light/dark. The knob position is pure CSS (reads the `dark` class on <html>), so there is no flash.
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);

  function flip() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
    setDark(next);
  }

  return (
    <button type="button" role="switch" aria-checked={dark} aria-label="Dark mode" onClick={flip}
      className="relative flex h-8 w-14 items-center rounded-full bg-line px-1">
      <span aria-hidden className="h-6 w-6 rounded-full bg-card shadow transition-transform duration-200 dark:translate-x-6 dark:bg-purple" />
    </button>
  );
}
