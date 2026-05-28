import { THEMES } from "@/lib/themes";
import { useTheme } from "@/hooks/useTheme";

export function ThemeSelector() {
  const { colorTheme, setThemeColor } = useTheme();

  return (
    <div className="flex flex-col gap-2">
      {THEMES.map((t) => {
        const active = colorTheme === t.name;
        return (
          <button
            key={t.name}
            onClick={() => setThemeColor(t.name)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
              active
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/40 hover:bg-muted"
            }`}
          >
            <span
              className="w-8 h-8 rounded-full flex-shrink-0 shadow-sm ring-2 ring-white/30"
              style={{ backgroundColor: t.previewColor }}
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium leading-tight ${active ? "text-primary" : "text-foreground"}`}>
                {t.emoji} {t.label}
              </p>
              {t.isDark && (
                <p className="text-xs text-muted-foreground mt-0.5">Dark theme</p>
              )}
            </div>
            {active && (
              <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
