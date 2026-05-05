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
  // Dark mode overrides
  darkPrimary?: string;
  darkBackground?: string;
  darkCard?: string;
  darkAccent?: string;
  darkBorder?: string;
  darkMuted?: string;
  previewColor: string;
}

export const THEMES: ThemeDefinition[] = [
  {
    name: "default",
    label: "Rose",
    primary: "340 25% 72%",
    primaryForeground: "340 40% 30%",
    background: "340 10% 99.5%",
    card: "0 0% 100%",
    accent: "340 15% 96%",
    border: "340 12% 94%",
    muted: "340 6% 98.5%",
    // Dark
    darkPrimary: "340 35% 65%",
    darkBackground: "340 15% 10%",
    darkCard: "340 15% 13%",
    darkAccent: "340 20% 18%",
    darkBorder: "340 12% 18%",
    darkMuted: "340 10% 15%",
    previewColor: "#e5b6c5",
  },
  {
    name: "midnight",
    label: "Midnight",
    primary: "239 55% 62%",
    primaryForeground: "0 0% 100%",
    background: "239 20% 98%",
    card: "0 0% 100%",
    accent: "239 40% 94%",
    border: "239 20% 92%",
    muted: "239 10% 97%",
    // Dark
    darkPrimary: "239 55% 65%",
    darkBackground: "222 35% 8%",
    darkCard: "222 35% 11%",
    darkAccent: "239 30% 18%",
    darkBorder: "222 30% 16%",
    darkMuted: "222 25% 13%",
    previewColor: "#5b5fc7",
  },
  {
    name: "ocean",
    label: "Ocean",
    primary: "189 55% 42%",
    primaryForeground: "0 0% 100%",
    background: "189 20% 98%",
    card: "0 0% 100%",
    accent: "189 40% 94%",
    border: "189 20% 92%",
    muted: "189 10% 97%",
    // Dark
    darkPrimary: "189 60% 45%",
    darkBackground: "210 40% 8%",
    darkCard: "210 40% 11%",
    darkAccent: "189 30% 18%",
    darkBorder: "210 30% 16%",
    darkMuted: "210 25% 13%",
    previewColor: "#2a9aad",
  },
  {
    name: "forest",
    label: "Forest",
    primary: "160 45% 40%",
    primaryForeground: "0 0% 100%",
    background: "160 15% 98%",
    card: "0 0% 100%",
    accent: "160 30% 94%",
    border: "160 15% 92%",
    muted: "160 10% 97%",
    // Dark
    darkPrimary: "160 50% 42%",
    darkBackground: "150 25% 8%",
    darkCard: "150 25% 11%",
    darkAccent: "160 25% 16%",
    darkBorder: "150 20% 16%",
    darkMuted: "150 15% 13%",
    previewColor: "#2d8f6f",
  },
  {
    name: "sunset",
    label: "Sunset",
    primary: "25 65% 55%",
    primaryForeground: "0 0% 100%",
    background: "25 20% 98%",
    card: "0 0% 100%",
    accent: "25 40% 94%",
    border: "25 20% 92%",
    muted: "25 10% 97%",
    // Dark
    darkPrimary: "25 65% 58%",
    darkBackground: "25 30% 8%",
    darkCard: "25 30% 11%",
    darkAccent: "25 25% 16%",
    darkBorder: "25 20% 16%",
    darkMuted: "25 15% 13%",
    previewColor: "#e68a3e",
  },
  {
    name: "minimal",
    label: "Minimal",
    primary: "215 15% 45%",
    primaryForeground: "0 0% 100%",
    background: "0 0% 100%",
    card: "0 0% 99%",
    accent: "215 10% 95%",
    border: "215 10% 92%",
    muted: "215 5% 97%",
    // Dark
    darkPrimary: "215 15% 65%",
    darkBackground: "215 15% 10%",
    darkCard: "215 15% 13%",
    darkAccent: "215 10% 20%",
    darkBorder: "215 10% 18%",
    darkMuted: "215 10% 15%",
    previewColor: "#5c6b7a",
  },
];

export function applyTheme(themeName: string, darkMode: boolean) {
  const theme = THEMES.find((t) => t.name === themeName) ?? THEMES[0];
  const root = document.documentElement;

  const setProp = (prop: string, light: string, dark?: string) => {
    root.style.setProperty(prop, darkMode && dark ? dark : light);
  };

  setProp("--primary", theme.primary, theme.darkPrimary);
  setProp("--primary-foreground", theme.primaryForeground);
  setProp("--background", theme.background, theme.darkBackground);
  setProp("--card", theme.card, theme.darkCard);
  setProp("--accent", theme.accent, theme.darkAccent);
  setProp("--border", theme.border, theme.darkBorder);
  setProp("--muted", theme.muted, theme.darkMuted);
  
  // Computed dependencies
  setProp("--popover", theme.card, theme.darkCard);
  setProp("--sidebar", theme.background, theme.darkBackground);
  setProp("--sidebar-accent", theme.accent, theme.darkAccent);
}
