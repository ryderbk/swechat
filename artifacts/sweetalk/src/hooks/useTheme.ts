import { useState, useEffect } from "react";
import { applyTheme } from "@/lib/themes";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      return (localStorage.getItem("theme") as "light" | "dark") ?? "light";
    } catch {
      return "light";
    }
  });

  const [colorTheme, setColorTheme] = useState<string>(() => {
    try {
      return localStorage.getItem("color_theme") ?? "default";
    } catch {
      return "default";
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
    applyTheme(colorTheme, theme === "dark");
  }, [theme, colorTheme]);

  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const setThemeColor = (name: string) => {
    setColorTheme(name);
    localStorage.setItem("color_theme", name);
    applyTheme(name, theme === "dark");
  };

  return { theme, toggle, colorTheme, setThemeColor };
}
