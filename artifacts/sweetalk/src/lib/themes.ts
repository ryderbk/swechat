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
    name: "blush",
    label: "Blush Love",
    emoji: "🌸",
    isDark: false,
    primary: "322 72% 68%",
    primaryForeground: "345 70% 18%",
    foreground: "345 68% 28%",
    background: "354 80% 97%",
    card: "354 70% 95%",
    accent: "351 65% 90%",
    accentForeground: "345 68% 30%",
    border: "354 45% 89%",
    muted: "354 50% 96%",
    mutedForeground: "333 55% 48%",
    ring: "322 72% 68%",
    previewColor: "#f472b6",
  },
  {
    name: "rosenight",
    label: "Rose Night",
    emoji: "🥀",
    isDark: true,
    primary: "345 72% 38%",
    primaryForeground: "0 80% 97%",
    foreground: "0 80% 94%",
    background: "224 62% 5%",
    card: "215 30% 16%",
    accent: "345 40% 20%",
    accentForeground: "351 80% 82%",
    border: "215 28% 23%",
    muted: "215 28% 13%",
    mutedForeground: "351 65% 75%",
    ring: "351 75% 68%",
    previewColor: "#9f1239",
  },
  {
    name: "lavender",
    label: "Lavender Dream",
    emoji: "💜",
    isDark: false,
    primary: "258 80% 72%",
    primaryForeground: "263 60% 12%",
    foreground: "263 60% 32%",
    background: "252 80% 98%",
    card: "252 70% 95%",
    accent: "280 60% 92%",
    accentForeground: "263 60% 32%",
    border: "252 45% 88%",
    muted: "252 55% 96%",
    mutedForeground: "263 55% 52%",
    ring: "258 80% 72%",
    previewColor: "#a78bfa",
  },
  {
    name: "sunset",
    label: "Sunset Romance",
    emoji: "🌅",
    isDark: false,
    primary: "351 80% 68%",
    primaryForeground: "15 65% 12%",
    foreground: "15 65% 26%",
    background: "38 80% 97%",
    card: "33 75% 92%",
    accent: "25 70% 91%",
    accentForeground: "15 65% 26%",
    border: "33 45% 87%",
    muted: "38 60% 95%",
    mutedForeground: "17 60% 40%",
    ring: "25 80% 55%",
    previewColor: "#fb7185",
  },
  {
    name: "classic",
    label: "Classic Love",
    emoji: "❤️",
    isDark: false,
    primary: "0 65% 48%",
    primaryForeground: "0 0% 100%",
    foreground: "216 25% 16%",
    background: "0 0% 100%",
    card: "0 70% 96%",
    accent: "0 55% 93%",
    accentForeground: "216 25% 16%",
    border: "0 35% 88%",
    muted: "0 40% 97%",
    mutedForeground: "0 45% 38%",
    ring: "0 65% 55%",
    previewColor: "#dc2626",
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

  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--primary-foreground", theme.primaryForeground);
  root.style.setProperty("--ring", theme.ring);

  const applyLight = theme.isDark || !darkMode;

  if (applyLight) {
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
    for (const prop of LIGHT_PROPS) {
      root.style.removeProperty(prop);
    }
  }
}
