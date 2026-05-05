import { THEMES } from "@/lib/themes";
import { useTheme } from "@/hooks/useTheme";

export function ThemeSelector() {
  const { colorTheme, setThemeColor } = useTheme();

  return (
    <div className="flex flex-wrap gap-3">
      {THEMES.map((t) => (
        <button
          key={t.name}
          title={t.label}
          onClick={() => setThemeColor(t.name)}
          className={`w-9 h-9 rounded-full shadow-sm border-2 transition-all hover:scale-110 ${
            colorTheme === t.name ? "border-foreground scale-110" : "border-transparent"
          }`}
          style={{ backgroundColor: t.previewColor }}
        />
      ))}
    </div>
  );
}
