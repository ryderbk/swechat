import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { applyTheme, THEMES } from "@/lib/themes";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  colorTheme: string;
  toggle: () => void;
  setThemeColor: (name: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      return (localStorage.getItem("theme") as ThemeMode) ?? "light";
    } catch {
      return "light";
    }
  });

  const [colorTheme, setColorThemeState] = useState<string>(() => {
    try {
      return localStorage.getItem("color_theme") ?? "peachkiss";
    } catch {
      return "peachkiss";
    }
  });

  const updateTheme = useCallback((newTheme: ThemeMode, newColor: string) => {
    const root = document.documentElement;
    const isDark = newTheme === "dark";
    
    // Update class
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply color variables
    applyTheme(newColor, isDark);
    
    // Persist
    localStorage.setItem("theme", newTheme);
    localStorage.setItem("color_theme", newColor);
  }, []);

  // Sync with DOM on any state change
  useEffect(() => {
    updateTheme(theme, colorTheme);
  }, [theme, colorTheme, updateTheme]);

  const toggle = useCallback(() => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const setThemeColor = useCallback((name: string) => {
    setColorThemeState(name);
    const selectedTheme = THEMES.find(t => t.name === name);
    if (selectedTheme?.isDark) {
      setThemeState("dark");
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, colorTheme, toggle, setThemeColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}
