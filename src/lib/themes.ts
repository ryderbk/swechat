export interface ThemeDefinition {
  name: string;
  label: string;
  emoji: string;
  isDark: boolean;
  /** CSS HSL values (no hsl() wrapper) */
  primary: string;
  primaryForeground: string;
  foreground: string;
  background: string;
  card: string;
  accent: string;
  accentForeground: string;
  border: string;
  muted: string;
  mutedForeground: string;
  ring: string;
  previewColor: string;
}

export const THEMES: ThemeDefinition[] = [
  {
    name: "peachkiss",
    label: "Warm Cream & Coral",
    emoji: "💝",
    isDark: false,
    primary: "0 100% 74%",
    primaryForeground: "0 0% 100%",
    foreground: "0 0% 18%",
    background: "30 100% 97%",
    card: "0 0% 100%",
    accent: "350 100% 91%",
    accentForeground: "0 0% 18%",
    border: "30 30% 88%",
    muted: "30 30% 93%",
    mutedForeground: "0 0% 38%",
    ring: "0 100% 74%",
    previewColor: "#FF7A7A",
  },
  {
    name: "moonlight",
    label: "Moonlight Love",
    emoji: "🌙",
    isDark: false,
    primary: "235 84% 58%",
    primaryForeground: "0 0% 100%",
    foreground: "222 47% 12%",
    background: "220 50% 97%",
    card: "0 0% 100%",
    accent: "235 80% 90%",
    accentForeground: "222 47% 12%",
    border: "220 30% 88%",
    muted: "220 30% 93%",
    mutedForeground: "220 20% 38%",
    ring: "235 84% 58%",
    previewColor: "#6366F1",
  },
  {
    name: "chocolate",
    label: "Chocolate Romance",
    emoji: "🍫",
    isDark: false,
    primary: "20 70% 32%",
    primaryForeground: "0 0% 100%",
    foreground: "20 40% 12%",
    background: "30 60% 97%",
    card: "0 0% 100%",
    accent: "30 80% 90%",
    accentForeground: "20 40% 12%",
    border: "30 30% 88%",
    muted: "30 30% 93%",
    mutedForeground: "20 20% 38%",
    ring: "20 70% 32%",
    previewColor: "#7C2D12",
  },
  {
    name: "ice",
    label: "Ice Love",
    emoji: "❄️",
    isDark: false,
    primary: "192 80% 45%",
    primaryForeground: "0 0% 100%",
    foreground: "197 79% 15%",
    background: "184 100% 97%",
    card: "0 0% 100%",
    accent: "189 80% 90%",
    accentForeground: "197 79% 15%",
    border: "185 40% 88%",
    muted: "185 40% 93%",
    mutedForeground: "194 70% 30%",
    ring: "192 80% 45%",
    previewColor: "#67E8F9",
  },
  {
    name: "pinkvelvet",
    label: "Pink Velvet",
    emoji: "🎀",
    isDark: false,
    primary: "333 75% 48%",
    primaryForeground: "0 0% 100%",
    foreground: "336 80% 15%",
    background: "354 100% 98%",
    card: "0 0% 100%",
    accent: "332 80% 92%",
    accentForeground: "336 80% 15%",
    border: "354 50% 90%",
    muted: "354 40% 94%",
    mutedForeground: "336 60% 38%",
    ring: "333 75% 48%",
    previewColor: "#DB2777",
  },
  {
    name: "golden",
    label: "Golden Love",
    emoji: "✨",
    isDark: false,
    primary: "38 92% 48%",
    primaryForeground: "0 0% 100%",
    foreground: "28 60% 15%",
    background: "48 80% 97%",
    card: "0 0% 100%",
    accent: "48 90% 90%",
    accentForeground: "28 60% 15%",
    border: "48 40% 88%",
    muted: "48 40% 93%",
    mutedForeground: "36 80% 35%",
    ring: "38 92% 48%",
    previewColor: "#FACC15",
  },
  {
    name: "sky",
    label: "Sky Love",
    emoji: "☁️",
    isDark: false,
    primary: "207 90% 54%",
    primaryForeground: "0 0% 100%",
    foreground: "201 80% 15%",
    background: "204 100% 98%",
    card: "0 0% 100%",
    accent: "204 90% 92%",
    accentForeground: "201 80% 15%",
    border: "204 40% 90%",
    muted: "204 40% 94%",
    mutedForeground: "201 80% 35%",
    ring: "207 90% 54%",
    previewColor: "#38BDF8",
  },
  {
    name: "wine",
    label: "Wine Passion",
    emoji: "🍷",
    isDark: false,
    primary: "345 75% 40%",
    primaryForeground: "0 0% 100%",
    foreground: "345 50% 12%",
    background: "350 70% 98%",
    card: "0 0% 100%",
    accent: "350 85% 92%",
    accentForeground: "345 50% 12%",
    border: "350 30% 90%",
    muted: "350 30% 94%",
    mutedForeground: "345 25% 42%",
    ring: "345 75% 40%",
    previewColor: "#7F1D1D",
  },
  {
    name: "coral",
    label: "Soft Coral Love",
    emoji: "🪸",
    isDark: false,
    primary: "351 95% 66%",
    primaryForeground: "0 0% 100%",
    foreground: "341 80% 18%",
    background: "0 100% 98%",
    card: "0 0% 100%",
    accent: "350 90% 92%",
    accentForeground: "341 80% 18%",
    border: "354 60% 91%",
    muted: "354 50% 95%",
    mutedForeground: "345 70% 38%",
    ring: "351 95% 66%",
    previewColor: "#FB7185",
  },
];

const LIGHT_PROPS = [
  "--background", "--foreground", "--card", "--popover",
  "--card-foreground", "--popover-foreground",
  "--accent", "--accent-foreground",
  "--border", "--input", "--muted", "--muted-foreground",
  "--sidebar", "--sidebar-foreground", "--sidebar-accent", "--sidebar-accent-foreground",
];

export function applyTheme(themeName: string, darkMode: boolean) {
  const theme = THEMES.find((t) => t.name === themeName) ?? THEMES[0];
  const root = document.documentElement;

  // Always apply primary colors from the selected theme
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--primary-foreground", theme.primaryForeground);
  root.style.setProperty("--ring", theme.ring);

  // Logic: 
  // 1. If darkMode is OFF (light mode requested):
  //    - If the theme is LIGHT (isDark: false), apply its specific colors.
  //    - If the theme is DARK (isDark: true), don't apply its colors (let it fall back to :root default light theme).
  // 2. If darkMode is ON (dark mode requested):
  //    - If the theme is DARK (isDark: true), apply its specific colors.
  //    - If the theme is LIGHT (isDark: false), don't apply its colors (let it fall back to .dark default dark theme).

  const shouldApplyThemeVariables = theme.isDark === darkMode;

  if (shouldApplyThemeVariables) {
    root.style.setProperty("--background", theme.background);
    root.style.setProperty("--foreground", theme.foreground);
    root.style.setProperty("--card", theme.card);
    root.style.setProperty("--popover", theme.card);
    root.style.setProperty("--card-foreground", theme.foreground);
    root.style.setProperty("--popover-foreground", theme.foreground);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent-foreground", theme.accentForeground);
    root.style.setProperty("--border", theme.border);
    root.style.setProperty("--input", theme.border);
    root.style.setProperty("--muted", theme.muted);
    root.style.setProperty("--muted-foreground", theme.mutedForeground);
    root.style.setProperty("--sidebar", theme.background);
    root.style.setProperty("--sidebar-foreground", theme.foreground);
    root.style.setProperty("--sidebar-accent", theme.accent);
    root.style.setProperty("--sidebar-accent-foreground", theme.accentForeground);
  } else {
    // Clear theme-specific variables to let CSS classes (:root or .dark) take over
    for (const prop of LIGHT_PROPS) {
      root.style.removeProperty(prop);
    }
  }
}
