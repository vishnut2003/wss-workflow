"use client";

import * as React from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";
const ALL_THEMES: Theme[] = ["light", "dark", "system"];

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  themes: Theme[];
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(raw) ? raw : "system";
  } catch {
    return "system";
  }
}

function readSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(() => readStoredTheme());
  const [systemTheme, setSystemTheme] = React.useState<ResolvedTheme>(() =>
    readSystemTheme()
  );

  React.useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) =>
      setSystemTheme(e.matches ? "dark" : "light");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme: ResolvedTheme =
    theme === "system" ? systemTheme : theme;

  React.useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_STORAGE_KEY) return;
      if (isTheme(e.newValue)) setThemeState(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Ignore quota or privacy-mode failures.
    }
  }, []);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      systemTheme,
      setTheme,
      themes: ALL_THEMES,
    }),
    [theme, resolvedTheme, systemTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (ctx) return ctx;
  return {
    theme: "system",
    resolvedTheme: "light",
    systemTheme: "light",
    setTheme: () => {},
    themes: ALL_THEMES,
  };
}
