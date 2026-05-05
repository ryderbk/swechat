export interface ThemeDefinition {
  name: string;
  label: string;
  primary: string;
  primaryForeground: string;
  background: string;
  card: string;
  accent: string;
  border: string;
  muted: string;
  previewColor: string;
}

export const THEMES: ThemeDefinition[] = [
  {
    name: "default",
    label: "Rose",
    primary: "340 38% 56%",
    primaryForeground: "0 0% 100%",
    background: "30 20% 97%",
    card: "0 0% 100%",
    accent: "340 18% 93%",
    border: "340 12% 90%",
    muted: "30 14% 95%",
    previewColor: "#b06880",
  },
  {
    name: "midnight",
    label: "Midnight",
    primary: "239 55% 62%",
    primaryForeground: "0 0% 100%",
    background: "222 32% 9%",
    card: "222 32% 13%",
    accent: "239 40% 22%",
    border: "222 32% 21%",
    muted: "222 32% 17%",
    previewColor: "#5b5fc7",
  },
  {
    name: "ocean",
    label: "Ocean",
    primary: "189 55% 42%",
    primaryForeground: "0 0% 100%",
    background: "210 40% 9%",
    card: "210 40% 13%",
    accent: "189 40% 18%",
    border: "210 40% 21%",
    muted: "210 40% 17%",
    previewColor: "#2a9aad",
  },
  {
    name: "forest",
    label: "Forest",
    primary: "160 50% 38%",
    primaryForeground: "0 0% 100%",
    background: "150 20% 9%",
    card: "150 20% 13%",
    accent: "160 40% 18%",
    border: "150 20% 21%",
    muted: "150 20% 17%",
    previewColor: "#2d8f6f",
  },
  {
    name: "sunset",
    label: "Sunset",
    primary: "25 62% 52%",
    primaryForeground: "0 0% 100%",
    background: "30 30% 97%",
    card: "0 0% 100%",
    accent: "25 40% 93%",
    border: "25 28% 89%",
    muted: "25 20% 95%",
    previewColor: "#c9742b",
  },
  {
    name: "candy",
    label: "Candy",
    primary: "330 45% 57%",
    primaryForeground: "0 0% 100%",
    background: "330 28% 97%",
    card: "0 0% 100%",
    accent: "330 30% 93%",
    border: "330 22% 89%",
    muted: "330 18% 95%",
    previewColor: "#c0608a",
  },
  {
    name: "galaxy",
    label: "Galaxy",
    primary: "270 48% 60%",
    primaryForeground: "0 0% 100%",
    background: "265 22% 7%",
    card: "265 22% 11%",
    accent: "270 38% 22%",
    border: "265 22% 20%",
    muted: "265 22% 15%",
    previewColor: "#8b5fc7",
  },
  {
    name: "minimal",
    label: "Minimal",
    primary: "215 14% 46%",
    primaryForeground: "0 0% 100%",
    background: "0 0% 100%",
    card: "0 0% 98%",
    accent: "215 12% 93%",
    border: "215 12% 88%",
    muted: "215 10% 95%",
    previewColor: "#5c6b7a",
  },
  {
    name: "gold",
    label: "Gold",
    primary: "43 60% 46%",
    primaryForeground: "0 0% 10%",
    background: "45 22% 97%",
    card: "0 0% 100%",
    accent: "43 40% 93%",
    border: "43 28% 89%",
    muted: "43 20% 95%",
    previewColor: "#c29a22",
  },
  {
    name: "rose",
    label: "Deep Rose",
    primary: "340 45% 44%",
    primaryForeground: "0 0% 100%",
    background: "340 28% 97%",
    card: "0 0% 100%",
    accent: "340 22% 93%",
    border: "340 16% 89%",
    muted: "340 14% 95%",
    previewColor: "#9e3b5c",
  },
];

const DARK_OVERRIDE_PROPS = [
  "--background", "--card", "--accent", "--border", "--muted",
  "--popover", "--sidebar", "--sidebar-accent",
];

export function applyTheme(themeName: string, darkMode: boolean) {
  const theme = THEMES.find((t) => t.name === themeName) ?? THEMES[0];
  const root = document.documentElement;

  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--primary-foreground", theme.primaryForeground);

  if (!darkMode) {
    root.style.setProperty("--background", theme.background);
    root.style.setProperty("--card", theme.card);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--border", theme.border);
    root.style.setProperty("--muted", theme.muted);
    root.style.setProperty("--popover", theme.card);
    root.style.setProperty("--sidebar", theme.background);
    root.style.setProperty("--sidebar-accent", theme.accent);
  } else {
    for (const prop of DARK_OVERRIDE_PROPS) {
      root.style.removeProperty(prop);
    }
  }
}
