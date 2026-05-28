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
    foreground: "0 0% 30%",
    background: "30 100% 97%",
    card: "0 0% 100%",
    accent: "350 100% 88%",
    accentForeground: "0 0% 30%",
    border: "30 30% 88%",
    muted: "30 30% 90%",
    mutedForeground: "0 0% 42%",
    ring: "0 100% 74%",
    previewColor: "#FF7A7A",
  },
  {
    name: "moonlight",
    label: "Moonlight Love",
    emoji: "🌙",
    isDark: true,
    primary: "239 84% 67%",
    primaryForeground: "226 100% 94%",
    foreground: "226 100% 94%",
    background: "222 47% 8%",
    card: "215 32% 17%",
    accent: "235 90% 74%",
    accentForeground: "226 100% 94%",
    border: "215 28% 23%",
    muted: "215 28% 13%",
    mutedForeground: "231 93% 82%",
    ring: "235 90% 74%",
    previewColor: "#6366F1",
  },
  {
    name: "chocolate",
    label: "Chocolate Romance",
    emoji: "🍫",
    isDark: true,
    primary: "15 74% 28%",
    primaryForeground: "60 9% 96%",
    foreground: "60 9% 96%",
    background: "20 10% 10%",
    card: "20 6% 15%",
    accent: "27 96% 61%",
    accentForeground: "60 9% 96%",
    border: "20 6% 20%",
    muted: "20 6% 12%",
    mutedForeground: "30 2% 83%",
    ring: "27 96% 61%",
    previewColor: "#7C2D12",
  },
  {
    name: "ice",
    label: "Ice Love",
    emoji: "❄️",
    isDark: false,
    primary: "187 92% 69%",
    primaryForeground: "197 79% 15%",
    foreground: "197 79% 15%",
    background: "184 100% 96%",
    card: "185 96% 90%",
    accent: "189 85% 53%",
    accentForeground: "197 79% 15%",
    border: "185 96% 85%",
    muted: "185 96% 93%",
    mutedForeground: "194 70% 27%",
    ring: "189 85% 53%",
    previewColor: "#67E8F9",
  },
  {
    name: "pinkvelvet",
    label: "Pink Velvet",
    emoji: "🎀",
    isDark: false,
    primary: "333 71% 51%",
    primaryForeground: "336 84% 17%",
    foreground: "336 84% 17%",
    background: "354 100% 97%",
    card: "354 100% 95%",
    accent: "332 82% 70%",
    accentForeground: "336 84% 17%",
    border: "354 100% 90%",
    muted: "354 100% 94%",
    mutedForeground: "336 74% 35%",
    ring: "332 82% 70%",
    previewColor: "#DB2777",
  },
  {
    name: "golden",
    label: "Golden Love",
    emoji: "✨",
    isDark: false,
    primary: "47 95% 53%",
    primaryForeground: "28 72% 26%",
    foreground: "28 72% 26%",
    background: "48 100% 96%",
    card: "48 98% 89%",
    accent: "45 93% 47%",
    accentForeground: "28 72% 26%",
    border: "48 98% 80%",
    muted: "48 98% 93%",
    mutedForeground: "36 91% 33%",
    ring: "45 93% 47%",
    previewColor: "#FACC15",
  },
  {
    name: "sky",
    label: "Sky Love",
    emoji: "☁️",
    isDark: false,
    primary: "199 92% 60%",
    primaryForeground: "201 80% 24%",
    foreground: "201 80% 24%",
    background: "204 100% 97%",
    card: "204 94% 94%",
    accent: "199 89% 48%",
    accentForeground: "201 80% 24%",
    border: "204 94% 90%",
    muted: "204 94% 95%",
    mutedForeground: "201 96% 32%",
    ring: "199 89% 48%",
    previewColor: "#38BDF8",
  },
  {
    name: "wine",
    label: "Wine Passion",
    emoji: "🍷",
    isDark: true,
    primary: "0 63% 31%",
    primaryForeground: "0 93% 94%",
    foreground: "0 93% 94%",
    background: "0 46% 7%",
    card: "0 47% 11%",
    accent: "0 72% 51%",
    accentForeground: "0 93% 94%",
    border: "0 47% 15%",
    muted: "0 47% 9%",
    mutedForeground: "0 96% 82%",
    ring: "0 72% 51%",
    previewColor: "#7F1D1D",
  },
  {
    name: "coral",
    label: "Soft Coral Love",
    emoji: "🪸",
    isDark: false,
    primary: "351 95% 71%",
    primaryForeground: "341 82% 30%",
    foreground: "341 82% 30%",
    background: "0 100% 98%",
    card: "354 100% 95%",
    accent: "350 89% 60%",
    accentForeground: "341 82% 30%",
    border: "354 100% 92%",
    muted: "354 100% 96%",
    mutedForeground: "345 88% 41%",
    ring: "350 89% 60%",
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
