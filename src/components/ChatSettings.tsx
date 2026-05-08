import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { saveUserPreference, getUserPreferences, muteNotifications, getMuteStatus, clearAllMessages } from "@/lib/firestore";
import { ThemeSelector } from "./ThemeSelector";
import { WallpaperSelector } from "./WallpaperSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X, Bell, BellOff, Trash2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  wallpaper: string;
  onWallpaperChange: (v: string) => void;
  bubbleColor: string;
  onBubbleColorChange: (v: string) => void;
  bubbleShape: string;
  onBubbleShapeChange: (v: string) => void;
  fontSize: string;
  onFontSizeChange: (v: string) => void;
}

const BUBBLE_SHAPES = [
  { label: "Rounded", value: "rounded" },
  { label: "Sharp", value: "sharp" },
  { label: "Cloud", value: "cloud" },
  { label: "Tail", value: "tail" },
];

const FONT_SIZES = [
  { label: "Small", value: "13px" },
  { label: "Medium", value: "15px" },
  { label: "Large", value: "17px" },
];

export function ChatSettings({
  open,
  onClose,
  wallpaper,
  onWallpaperChange,
  bubbleColor,
  onBubbleColorChange,
  bubbleShape,
  onBubbleShapeChange,
  fontSize,
  onFontSizeChange,
}: Props) {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const [nickname, setNickname] = useState("");
  const [readReceipts, setReadReceipts] = useState(true);
  const [lastSeen, setLastSeen] = useState(true);
  const [mutedUntil, setMutedUntil] = useState<Date | null>(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!user || !open) return;
    getUserPreferences(user.uid).then((prefs) => {
      if (prefs.nickname) setNickname(prefs.nickname as string);
      if (prefs.readReceipts !== undefined) setReadReceipts(prefs.readReceipts as boolean);
      if (prefs.lastSeen !== undefined) setLastSeen(prefs.lastSeen as boolean);
    });
    getMuteStatus(user.uid).then(setMutedUntil);
  }, [user, open]);

  const save = async (update: Record<string, unknown>) => {
    if (!user) return;
    await saveUserPreference(user.uid, update);
  };

  const handleMute = async (hours: number | null) => {
    if (!user) return;
    const until = hours ? new Date(Date.now() + hours * 3600 * 1000) : null;
    await muteNotifications(user.uid, until);
    setMutedUntil(until);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-80 bg-background border-l border-border overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-background z-10">
          <h2 className="font-semibold text-foreground">Chat Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 space-y-6">
          {/* Theme */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Theme</h3>
            <ThemeSelector />
            <div className="flex items-center justify-between mt-3">
              <Label className="text-sm">Dark mode</Label>
              <Switch checked={theme === "dark"} onCheckedChange={toggle} />
            </div>
          </section>

          {/* Wallpaper */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Wallpaper</h3>
            <WallpaperSelector value={wallpaper} onChange={onWallpaperChange} />
          </section>

          {/* Bubble color */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Bubble Color</h3>
            <input
              type="color"
              value={bubbleColor}
              onChange={(e) => onBubbleColorChange(e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border border-border"
            />
          </section>

          {/* Bubble shape */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Bubble Shape</h3>
            <div className="grid grid-cols-2 gap-2">
              {BUBBLE_SHAPES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => onBubbleShapeChange(s.value)}
                  className={`py-2 text-sm rounded-xl border-2 transition-colors ${
                    bubbleShape === s.value ? "border-primary bg-primary/10 text-primary" : "border-border"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>

          {/* Font size */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Font Size</h3>
            <div className="flex gap-2">
              {FONT_SIZES.map((f) => (
                <button
                  key={f.value}
                  onClick={() => onFontSizeChange(f.value)}
                  className={`flex-1 py-2 text-sm rounded-xl border-2 transition-colors ${
                    fontSize === f.value ? "border-primary bg-primary/10 text-primary" : "border-border"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </section>



          {/* Notifications mute */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Notifications</h3>
            <div className="flex flex-col gap-2">
              {mutedUntil ? (
                <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => handleMute(null)}>
                  <Bell className="w-3.5 h-3.5" /> Unmute
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => handleMute(8)}>
                    <BellOff className="w-3.5 h-3.5" /> Mute for 8 hours
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => handleMute(168)}>
                    <BellOff className="w-3.5 h-3.5" /> Mute for 1 week
                  </Button>
                </>
              )}
            </div>
          </section>

          {/* Read receipts */}
          <section>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Read receipts</Label>
              <Switch
                checked={readReceipts}
                onCheckedChange={(v) => { setReadReceipts(v); save({ readReceipts: v }); }}
              />
            </div>
          </section>

          {/* Last seen */}
          <section>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Show last seen</Label>
              <Switch
                checked={lastSeen}
                onCheckedChange={(v) => { setLastSeen(v); save({ lastSeen: v }); }}
              />
            </div>
          </section>

          {/* Clear chat */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Danger Zone</h3>
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-xl gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
              disabled={clearing}
              onClick={async () => {
                if (!confirm("Delete all messages? This cannot be undone.")) return;
                setClearing(true);
                try {
                  await clearAllMessages();
                } finally {
                  setClearing(false);
                }
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {clearing ? "Clearing…" : "Clear all messages"}
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
