"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type AccentColor =
  | "blue"
  | "green"
  | "purple"
  | "orange"
  | "red"
  | "teal"
  | "yellow"
  | "pink";

const ACCENT_COLORS: AccentColor[] = [
  "blue",
  "green",
  "purple",
  "orange",
  "red",
  "teal",
  "yellow",
  "pink",
];

type Theme = "light" | "dark";

interface ThemeContextProps {
  theme: Theme;
  accent: AccentColor;
  setTheme: (theme: Theme) => void;
  setAccent: (accent: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [accent, setAccentState] = useState<AccentColor>("blue");
  const [hasMounted, setHasMounted] = useState(false);

  // Only load from localStorage on client after mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    const storedAccent = localStorage.getItem("accent") as AccentColor | null;
    if (storedTheme) setThemeState(storedTheme);
    if (storedAccent && ACCENT_COLORS.includes(storedAccent)) setAccentState(storedAccent);
    setHasMounted(true);
  }, []);

  // Apply theme to <html> class
  useEffect(() => {
    if (!hasMounted) return;
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme, hasMounted]);

  // Store accent in localStorage
  useEffect(() => {
    if (!hasMounted) return;
    localStorage.setItem("accent", accent);
  }, [accent, hasMounted]);

  const setTheme = (t: Theme) => setThemeState(t);
  const setAccent = (a: AccentColor) => setAccentState(a);

  // Prevent rendering until client-side values are loaded
  if (!hasMounted) return null;

  return (
    <ThemeContext.Provider value={{ theme, accent, setTheme, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export { ACCENT_COLORS };