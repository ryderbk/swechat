import { useState, ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";

const EMOJI_CATEGORIES: Record<string, string[]> = {
  "😊": ["😊", "😂", "🥰", "😍", "😘", "🥺", "😭", "😅", "😉", "😋", "🤩", "😇", "🥳", "😌", "🤗", "😏", "😜", "🤭", "😆", "😄", "😁", "🤣", "😃", "😀", "🙃", "😶", "🫠", "🤔", "😐"],
  "❤️": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️", "💌", "🫶", "💑"],
  "👋": ["👋", "🤝", "🙌", "👏", "🤜", "🤛", "👊", "✊", "✋", "🖐", "👍", "👎", "🤞", "🤟", "🤙", "💪", "🙏", "🫶", "👌", "🤌"],
  "🌸": ["🌸", "🌺", "🌼", "🌻", "🌹", "🌷", "🍀", "🌿", "🍃", "🌙", "⭐", "🌟", "✨", "🌈", "☀️", "❄️", "🌊", "🦋", "🌴", "🌵"],
  "🍓": ["🍓", "🍒", "🍑", "🍫", "🍰", "🎂", "🍩", "🍦", "☕", "🧋", "🍷", "🥂", "🍾", "🍕", "🍣", "🍜", "🍱", "🧁", "🍪", "🎁"],
};

const CATEGORY_LABELS: Record<string, string> = {
  "😊": "Smileys",
  "❤️": "Love",
  "👋": "Gestures",
  "🌸": "Nature",
  "🍓": "Food & Fun",
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  trigger?: ReactNode;
}

export function EmojiPicker({ onSelect, trigger }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("😊");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ? (
          <span>{trigger}</span>
        ) : (
          <Button
            data-testid="button-emoji"
            variant="ghost"
            size="icon"
            type="button"
            className="rounded-xl text-muted-foreground hover:text-foreground"
          >
            <Smile className="w-5 h-5" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-96 p-3 rounded-2xl"
        sideOffset={8}
      >
        <div className="flex gap-1 mb-3">
          {Object.keys(EMOJI_CATEGORIES).map((cat) => (
            <button
              key={cat}
              onClick={() => setTab(cat)}
              title={CATEGORY_LABELS[cat]}
              className={`flex-1 text-xl py-1.5 rounded-xl transition-colors ${
                tab === cat
                  ? "bg-primary/15 ring-1 ring-primary/30"
                  : "hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-8 gap-1">
          {EMOJI_CATEGORIES[tab]?.map((emoji) => (
            <button
              key={emoji}
              onClick={() => { onSelect(emoji); setOpen(false); }}
              className="text-2xl p-2 rounded-xl hover:bg-muted transition-colors leading-none flex items-center justify-center"
              data-testid={`emoji-${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
