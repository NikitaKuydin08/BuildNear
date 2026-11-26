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
      className="relative flex h-8 w-14 items-center rounded-full bg-white/15 px-1 text-xs">
      <span aria-hidden className="absolute left-1.5 text-[13px]">☀</span>
      <span aria-hidden className="absolute right-1.5 text-[13px]">☾</span>
      <span aria-hidden className="relative z-10 h-6 w-6 rounded-full bg-accent shadow transition-transform duration-200 dark:translate-x-6 dark:bg-accent2" />
    </button>
  );
}
