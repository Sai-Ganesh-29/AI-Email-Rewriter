"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("ui:theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ? stored === "dark" : prefersDark;
    setDark(initial);
    document.documentElement.classList.toggle("dark", initial);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ui:theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-900"
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
    >
      {dark ? "🌙" : "☀️"}
    </button>
  );
}
