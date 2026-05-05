import { useState, ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";

const EMOJI_CATEGORIES: Record<string, string[]> = {
  "Smileys": ["😊", "😂", "🥰", "😍", "😘", "🥺", "😭", "😅", "😉", "😋", "🤩", "😇", "🥳", "😌", "🤗", "😏", "😜", "🤭"],
  "Love": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️", "💌"],
  "Gestures": ["👋", "🤝", "🙌", "👏", "🤜", "🤛", "👊", "✊", "✋", "🖐", "👍", "👎", "🤞", "🤟", "🤙", "💪", "🙏", "🫶"],
  "Nature": ["🌸", "🌺", "🌼", "🌻", "🌹", "🌷", "🍀", "🌿", "🍃", "🌙", "⭐", "🌟", "✨", "🌈", "☀️", "❄️", "🌊", "🦋"],
  "Food": ["🍓", "🍒", "🍑", "🍫", "🍰", "🎂", "🍩", "🍦", "☕", "🧋", "🍷", "🥂", "🍾", "🍕", "🍣", "🍜", "🍱", "🧁"],
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  trigger?: ReactNode;
}

export function EmojiPicker({ onSelect, trigger }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("Smileys");

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
        className="w-72 p-2 rounded-2xl"
        sideOffset={8}
      >
        <div className="flex gap-1 mb-2 overflow-x-auto no-scrollbar">
          {Object.keys(EMOJI_CATEGORIES).map((cat) => (
            <button
              key={cat}
              onClick={() => setTab(cat)}
              className={`text-xs px-2 py-1 rounded-lg whitespace-nowrap transition-colors ${
                tab === cat
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-9 gap-0.5">
          {EMOJI_CATEGORIES[tab]?.map((emoji) => (
            <button
              key={emoji}
              onClick={() => { onSelect(emoji); setOpen(false); }}
              className="text-xl p-1 rounded-lg hover:bg-muted transition-colors"
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
