import { useState, useRef } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { Check, CheckCheck, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { Message, editMessage, deleteMessage, reactToMessage } from "@/lib/firestore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface Props {
  message: Message;
  isMine: boolean;
  myUid: string;
}

const REACTION_EMOJIS = ["❤️", "😂", "😮"];

function formatTime(date: Date) {
  if (isToday(date)) return `Today ${format(date, "h:mm a")}`;
  if (isYesterday(date)) return `Yesterday ${format(date, "h:mm a")}`;
  return format(date, "MMM d, h:mm a");
}

function StatusIcon({ status }: { status: Message["status"] }) {
  if (status === "read") return <CheckCheck className="w-3.5 h-3.5 text-blue-400" />;
  if (status === "delivered") return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />;
  return <Check className="w-3.5 h-3.5 text-muted-foreground" />;
}

export function MessageBubble({ message, isMine, myUid }: Props) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.text ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const createdAt = message.createdAt?.toDate?.() ?? new Date();

  const handleLongPressStart = () => {
    longPressTimer.current = setTimeout(() => setMenuOpen(true), 500);
  };
  const handleLongPressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleEdit = async () => {
    if (!editText.trim() || editText === message.text) { setEditing(false); return; }
    await editMessage(message.id, editText.trim());
    setEditing(false);
    setMenuOpen(false);
  };

  const handleDelete = async () => {
    await deleteMessage(message.id);
    setMenuOpen(false);
  };

  const handleReact = async (emoji: string) => {
    const existing = message.reactions?.[emoji] ?? [];
    const hasReacted = existing.includes(myUid);
    await reactToMessage(message.id, emoji, myUid, hasReacted);
    setMenuOpen(false);
  };

  const allReactions = Object.entries(message.reactions ?? {}).filter(([, uids]) => uids.length > 0);

  if (message.deleted) {
    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"} px-4 mb-1`}>
        <span className="text-xs italic text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-xl">
          This message was deleted
        </span>
      </div>
    );
  }

  return (
    <div
      data-testid={`message-${message.id}`}
      className={`flex ${isMine ? "justify-end" : "justify-start"} px-4 mb-2 group`}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
    >
      <div className={`max-w-[75%] relative ${isMine ? "items-end" : "items-start"} flex flex-col`}>
        {/* Bubble */}
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <div
              onContextMenu={(e) => { e.preventDefault(); setMenuOpen(true); }}
              className={`rounded-2xl px-3.5 py-2.5 shadow-sm cursor-pointer transition-transform active:scale-[0.98] ${
                isMine
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-card text-foreground border border-border rounded-bl-sm"
              }`}
            >
              {/* Image */}
              {message.type === "image" && message.imageUrl && (
                <img
                  src={message.imageUrl}
                  alt="Shared image"
                  className="rounded-xl max-w-full max-h-64 mb-1 object-cover"
                  data-testid={`img-message-${message.id}`}
                />
              )}

              {/* Voice */}
              {message.type === "voice" && message.voiceUrl && (
                <audio
                  controls
                  src={message.voiceUrl}
                  className="max-w-[200px]"
                  data-testid={`audio-${message.id}`}
                />
              )}

              {/* Text */}
              {editing ? (
                <div className="flex flex-col gap-1">
                  <textarea
                    className="bg-transparent resize-none outline-none text-sm w-full min-w-[150px]"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEdit(); }
                      if (e.key === "Escape") setEditing(false);
                    }}
                    autoFocus
                    rows={2}
                  />
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => setEditing(false)} className="text-xs opacity-70">Cancel</button>
                    <button onClick={handleEdit} className="text-xs font-medium">Save</button>
                  </div>
                </div>
              ) : (
                message.text && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.text}
                    {message.edited && (
                      <span className="text-[10px] opacity-60 ml-1">(edited)</span>
                    )}
                  </p>
                )
              )}
            </div>
          </PopoverTrigger>

          <PopoverContent side={isMine ? "left" : "right"} align="center" className="w-auto p-2 rounded-2xl">
            {/* Reactions */}
            <div className="flex gap-1 mb-2">
              {REACTION_EMOJIS.map((emoji) => {
                const reacted = (message.reactions?.[emoji] ?? []).includes(myUid);
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className={`text-lg p-1 rounded-lg transition-colors ${reacted ? "bg-primary/20" : "hover:bg-muted"}`}
                    data-testid={`react-${emoji}-${message.id}`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
            {/* Actions (own messages only) */}
            {isMine && (
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => { setEditing(true); setMenuOpen(false); }}
                  className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg hover:bg-muted text-left"
                  data-testid={`button-edit-${message.id}`}
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg hover:bg-destructive/10 text-destructive text-left"
                  data-testid={`button-delete-${message.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Reactions display */}
        {allReactions.length > 0 && (
          <div className={`flex gap-0.5 mt-0.5 flex-wrap ${isMine ? "justify-end" : "justify-start"}`}>
            {allReactions.map(([emoji, uids]) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="text-xs bg-muted border border-border rounded-full px-1.5 py-0.5 flex items-center gap-0.5 hover:bg-muted/80"
              >
                {emoji} <span className="text-[10px] text-muted-foreground">{uids.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Timestamp + status */}
        <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end" : "justify-start"}`}>
          <span className="text-[10px] text-muted-foreground">{formatTime(createdAt)}</span>
          {isMine && <StatusIcon status={message.status} />}
        </div>
      </div>
    </div>
  );
}
