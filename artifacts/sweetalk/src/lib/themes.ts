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
    primary: "347 77% 50%",
    primaryForeground: "0 0% 100%",
    background: "0 0% 98%",
    card: "0 0% 100%",
    accent: "347 77% 95%",
    border: "347 20% 88%",
    muted: "347 10% 94%",
    previewColor: "#f43f5e",
  },
  {
    name: "midnight",
    label: "Midnight",
    primary: "239 84% 67%",
    primaryForeground: "0 0% 100%",
    background: "222 47% 8%",
    card: "222 47% 12%",
    accent: "239 84% 20%",
    border: "222 47% 20%",
    muted: "222 47% 16%",
    previewColor: "#6366f1",
  },
  {
    name: "ocean",
    label: "Ocean",
    primary: "189 94% 43%",
    primaryForeground: "0 0% 100%",
    background: "210 60% 8%",
    card: "210 60% 12%",
    accent: "189 94% 15%",
    border: "210 60% 20%",
    muted: "210 60% 16%",
    previewColor: "#06b6d4",
  },
  {
    name: "forest",
    label: "Forest",
    primary: "160 84% 39%",
    primaryForeground: "0 0% 100%",
    background: "150 30% 8%",
    card: "150 30% 12%",
    accent: "160 84% 15%",
    border: "150 30% 20%",
    muted: "150 30% 16%",
    previewColor: "#10b981",
  },
  {
    name: "sunset",
    label: "Sunset",
    primary: "25 95% 53%",
    primaryForeground: "0 0% 100%",
    background: "30 50% 97%",
    card: "0 0% 100%",
    accent: "25 95% 93%",
    border: "25 40% 88%",
    muted: "25 30% 94%",
    previewColor: "#f97316",
  },
  {
    name: "candy",
    label: "Candy",
    primary: "330 81% 60%",
    primaryForeground: "0 0% 100%",
    background: "330 50% 97%",
    card: "0 0% 100%",
    accent: "330 81% 93%",
    border: "330 40% 88%",
    muted: "330 30% 94%",
    previewColor: "#ec4899",
  },
  {
    name: "galaxy",
    label: "Galaxy",
    primary: "270 76% 63%",
    primaryForeground: "0 0% 100%",
    background: "265 30% 5%",
    card: "265 30% 9%",
    accent: "270 76% 20%",
    border: "265 30% 18%",
    muted: "265 30% 13%",
    previewColor: "#a855f7",
  },
  {
    name: "minimal",
    label: "Minimal",
    primary: "215 16% 47%",
    primaryForeground: "0 0% 100%",
    background: "0 0% 100%",
    card: "0 0% 98%",
    accent: "215 16% 93%",
    border: "215 16% 88%",
    muted: "215 16% 95%",
    previewColor: "#64748b",
  },
  {
    name: "gold",
    label: "Gold",
    primary: "43 96% 46%",
    primaryForeground: "0 0% 0%",
    background: "45 30% 97%",
    card: "0 0% 100%",
    accent: "43 96% 93%",
    border: "43 40% 88%",
    muted: "43 30% 94%",
    previewColor: "#eab308",
  },
  {
    name: "rose",
    label: "Deep Rose",
    primary: "340 82% 42%",
    primaryForeground: "0 0% 100%",
    background: "340 50% 97%",
    card: "0 0% 100%",
    accent: "340 82% 93%",
    border: "340 40% 88%",
    muted: "340 30% 94%",
    previewColor: "#be185d",
  },
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
  }
}
