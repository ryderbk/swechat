import { useState, useEffect, useRef } from "react";
import { subscribeToSharedNote, updateSharedNote } from "@/lib/firestore";
import { StickyNote } from "lucide-react";

export function SharedNote() {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsub = subscribeToSharedNote((note) => {
      if (note) setContent(note.content);
    });
    return unsub;
  }, []);

  const handleChange = (val: string) => {
    setContent(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      await updateSharedNote(val);
      setSaving(false);
    }, 800);
  };

  return (
    <div className="mx-3 mt-2 mb-1">
      <div className="bg-accent/30 border border-accent/40 rounded-2xl px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <StickyNote className="w-3.5 h-3.5 text-accent-foreground/70" />
          <span className="text-xs font-medium text-accent-foreground/70">
            Our note {saving && <span className="opacity-50">· saving…</span>}
          </span>
        </div>
        <textarea
          data-testid="input-shared-note"
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Write something just for the two of you…"
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none leading-relaxed"
          rows={2}
        />
      </div>
    </div>
  );
}
