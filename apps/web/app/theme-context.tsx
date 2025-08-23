"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

type AccentColor =
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

  // Load from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    const storedAccent = localStorage.getItem("accent") as AccentColor | null;
    if (storedTheme) setThemeState(storedTheme);
    if (storedAccent && ACCENT_COLORS.includes(storedAccent)) setAccentState(storedAccent);
  }, []);

  // Apply theme to <html> class
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Store accent in localStorage
  useEffect(() => {
    localStorage.setItem("accent", accent);
  }, [accent]);

  const setTheme = (t: Theme) => setThemeState(t);
  const setAccent = (a: AccentColor) => setAccentState(a);

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