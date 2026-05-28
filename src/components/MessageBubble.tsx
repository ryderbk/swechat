import { useState, useRef } from "react";
import { format, isToday, isYesterday } from "date-fns";
import {
  Check,
  CheckCheck,
  Pencil,
  Trash2,
  Star,
  Pin,
  Reply,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  Archive,
  File,
  Loader2,
} from "lucide-react";
import {
  Message,
  editMessage,
  deleteMessage,
  reactToMessage,
  starMessage,
  pinMessage,
  unpinMessage,
} from "@/lib/firestore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EmojiPicker } from "@/components/EmojiPicker";
import { formatText } from "@/lib/formatText";
import { VoiceMessage } from "./VoiceMessage";

interface Props {
  message: Message;
  isMine: boolean;
  myUid: string;
  searchTerm?: string;
  onReply?: (msg: Message) => void;
  onJumpTo?: (id: string) => void;
  bubbleColor?: string;
  bubbleShape?: string;
  fontSize?: string;
}

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

function formatTime(date: Date) {
  if (isToday(date)) return `Today ${format(date, "h:mm a")}`;
  if (isYesterday(date)) return `Yesterday ${format(date, "h:mm a")}`;
  return format(date, "MMM d, h:mm a");
}

function StatusIcon({ status }: { status: Message["status"] }) {
  if (status === "sending") return <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />;
  if (status === "read") return <CheckCheck className="w-3.5 h-3.5 text-blue-400" />;
  if (status === "delivered") return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />;
  return <Check className="w-3.5 h-3.5 text-muted-foreground" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["xls", "xlsx"].includes(ext)) return <FileSpreadsheet className="w-6 h-6 text-green-500" />;
  if (["zip", "gz", "rar"].includes(ext)) return <Archive className="w-6 h-6 text-yellow-500" />;
  if (ext === "pdf") return <FileText className="w-6 h-6 text-red-500" />;
  return <File className="w-6 h-6 text-muted-foreground" />;
}

function getBubbleRadiusClass(shape: string, isMine: boolean) {
  switch (shape) {
    case "sharp": return "rounded-none";
    case "cloud": return "rounded-[24px]";
    case "tail":
      return isMine
        ? "rounded-2xl rounded-br-sm"
        : "rounded-2xl rounded-bl-sm";
    default:
      return isMine
        ? "rounded-2xl rounded-br-sm"
        : "rounded-2xl rounded-bl-sm";
  }
}

export function MessageBubble({
  message,
  isMine,
  myUid,
  searchTerm,
  onReply,
  onJumpTo,
  bubbleColor,
  bubbleShape = "rounded",
  fontSize = "15px",
  showTime = true,
  isGrouped = false,
}: Props & { showTime?: boolean; isGrouped?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.text ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFloatHeart, setShowFloatHeart] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef<number>(0);
  const swipeStartX = useRef<number>(0);
  const swipedRef = useRef(false);

  const createdAt = message.createdAt?.toDate?.() ?? new Date();
  const radiusClass = getBubbleRadiusClass(bubbleShape, isMine);

  const handleLongPressStart = () => {
    longPressTimer.current = setTimeout(() => setMenuOpen(true), 500);
  };
  const handleLongPressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      handleDoubleTap();
    }
    lastTapRef.current = now;
  };

  const handleDoubleTap = () => {
    onReply?.(message);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
    swipedRef.current = false;
    handleLongPressStart();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - swipeStartX.current;
    if (dx > 60 && !swipedRef.current) {
      swipedRef.current = true;
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      onReply?.(message);
    }
  };

  const handleTouchEnd = () => {
    handleLongPressEnd();
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

  const handleStar = async () => {
    await starMessage(message.id, !message.starred);
    setMenuOpen(false);
  };

  const handlePin = async () => {
    try {
      if (message.starred) {
        await unpinMessage(message.id);
      } else {
        await pinMessage(message.id, message.text ?? "[media]", message.senderId);
      }
    } catch {}
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

  if (message.type === "game" && message.gameData) {
    const gd = message.gameData;
    return (
      <div
        data-message-id={message.id}
        className={`flex ${isMine ? "justify-end" : "justify-start"} px-4 ${isGrouped ? "mb-0.5" : "mb-2"}`}
      >
        <div className="max-w-[85%] bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/30 rounded-2xl p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-lg">{gd.emoji}</span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{gd.gameName}</span>
            <span className="ml-auto text-[10px] text-muted-foreground">{formatTime(createdAt)}</span>
          </div>
          <p className="text-xs text-foreground font-medium leading-snug">{gd.result}</p>
          {gd.pandaComment && (
            <div className="mt-2 flex items-start gap-1.5 bg-background/50 rounded-xl p-2">
              <span className="text-sm flex-shrink-0">🐼</span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{gd.pandaComment}</p>
            </div>
          )}
          {gd.matched && (
            <div className="mt-1.5 text-center">
              <span className="text-[10px] font-bold text-primary">Perfect match! 🎉</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const bubbleStyle = isMine && bubbleColor
    ? { backgroundColor: bubbleColor, color: "#fff" }
    : undefined;

  return (
    <div
      data-message-id={message.id}
      data-testid={`message-${message.id}`}
      className={`flex ${isMine ? "justify-end" : "justify-start"} px-4 ${isGrouped ? "mb-0.5" : "mb-2"} group animate-in fade-in slide-in-from-bottom-1 duration-300`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
      onClick={handleTap}
    >
      <div className={`max-w-[85%] relative ${isMine ? "items-end" : "items-start"} flex flex-col`}>
        {/* AI Profile info */}
        {message.isAI && (
          <div className="flex items-center gap-1.5 mb-1 px-1">
             <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
               <span className="text-xs">🐼</span>
             </div>
             <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Panda</span>
             <span className="text-[8px] bg-primary/10 text-primary px-1 rounded uppercase font-bold">AI</span>
          </div>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <button
            className="mb-1 text-left max-w-full border-l-2 border-primary pl-2 text-xs text-muted-foreground bg-muted/40 rounded-r-lg py-1 pr-2 truncate hover:bg-muted/60 transition-colors"
            onClick={() => onJumpTo?.(message.replyTo!.id)}
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-[10px] text-primary uppercase tracking-tight">
                {message.replyTo.isAI ? "Panda" : message.replyTo.senderId === myUid ? "You" : "Partner"}
              </span>
              <span className="truncate">
                {message.replyTo.type === "game" 
                  ? `${message.replyTo.emoji} ${message.replyTo.gameName}`
                  : message.replyTo.type === "image"
                  ? "📷 Photo"
                  : message.replyTo.type === "video"
                  ? "🎥 Video"
                  : message.replyTo.type === "voice"
                  ? "🎤 Voice message"
                  : message.replyTo.type === "document"
                  ? "📄 Document"
                  : message.replyTo.type === "gif"
                  ? "👾 GIF"
                  : message.replyTo.text}
              </span>
            </div>
          </button>
        )}

        {/* Floating heart animation */}
        {showFloatHeart && (
          <span
            className="absolute text-2xl pointer-events-none select-none z-20"
            style={{
              left: "50%",
              bottom: "100%",
              animation: "floatUp 0.8s ease-out forwards",
            }}
          >
            ❤️
          </span>
        )}

        {/* Starred indicator */}
        {message.starred && (
          <span className="text-[10px] text-yellow-500 mb-0.5 flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 fill-current" /> Starred
          </span>
        )}

        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <div
              onContextMenu={(e) => { e.preventDefault(); setMenuOpen(true); }}
              style={{ ...bubbleStyle, fontSize }}
              className={`${radiusClass} px-3.5 py-2.5 shadow-sm cursor-pointer transition-transform active:scale-[0.98] ${
                isMine && !bubbleColor
                  ? "bg-primary text-primary-foreground"
                  : !isMine
                  ? "bg-card text-foreground border border-border"
                  : ""
              }`}
            >
              {/* Video */}
              {message.type === "video" && message.videoUrl && (
                <video
                  controls
                  src={message.videoUrl}
                  className="rounded-xl max-w-full max-h-64 mb-1"
                  data-testid={`video-${message.id}`}
                />
              )}

              {/* Document */}
              {message.type === "document" && message.documentUrl && (
                <a
                  href={message.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 min-w-[180px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DocIcon name={message.documentName ?? "file"} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {message.documentName ?? "Document"}
                    </p>
                    {message.documentSize != null && (
                      <p className="text-xs opacity-70">{formatBytes(message.documentSize)}</p>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 opacity-70 flex-shrink-0" />
                </a>
              )}

              {/* Image */}
              {message.type === "image" && (message.imageUrl || message.localPath) && (
                <img
                  src={message.imageUrl ?? message.localPath}
                  alt="Shared image"
                  className="rounded-xl max-w-full max-h-64 mb-1 object-cover"
                  data-testid={`img-message-${message.id}`}
                />
              )}

              {/* GIF */}
              {message.type === "gif" && (message.gifUrl || message.previewUrl) && (
                <div className="relative rounded-xl overflow-hidden bg-muted">
                  <img
                    src={message.gifUrl ?? message.previewUrl}
                    alt="GIF"
                    className="max-w-full max-h-80 object-contain"
                    style={message.width && message.height ? { aspectRatio: `${message.width}/${message.height}` } : {}}
                  />
                  {message.status === "sending" && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                       <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
              )}

              {/* Voice */}
              {message.type === "voice" && message.voiceUrl && (
                <VoiceMessage url={message.voiceUrl} isMine={isMine} />
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
                  <p className="chat-text leading-relaxed whitespace-pre-wrap break-words">
                    {formatText(message.text, searchTerm)}
                    {message.edited && (
                      <span className="text-[10px] opacity-60 ml-1">(edited)</span>
                    )}
                  </p>
                )
              )}

              {/* Link Preview */}
              {message.linkPreview && (
                <button
                  className="mt-2 text-left w-full rounded-xl border border-border/50 overflow-hidden shadow-sm hover:opacity-90 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(message.linkPreview!.url, "_blank");
                  }}
                >
                  {message.linkPreview.image && (
                    <img
                      src={message.linkPreview.image}
                      alt="Preview"
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="p-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${new URL(message.linkPreview.url).hostname}&sz=16`}
                        alt=""
                        className="w-3.5 h-3.5"
                      />
                      <span className="text-[11px] opacity-60 truncate">
                        {new URL(message.linkPreview.url).hostname}
                      </span>
                    </div>
                    <p className="text-xs font-semibold leading-snug truncate">
                      {message.linkPreview.title}
                    </p>
                    {message.linkPreview.description && (
                      <p className="text-[11px] opacity-70 line-clamp-2 mt-0.5">
                        {message.linkPreview.description}
                      </p>
                    )}
                  </div>
                </button>
              )}
            </div>
          </PopoverTrigger>

          <PopoverContent side={isMine ? "left" : "right"} align="center" className="w-auto p-2 rounded-2xl">
            {/* Reactions */}
            <div className="flex gap-1 mb-2 flex-wrap">
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
              <EmojiPicker
                onSelect={(emoji) => { handleReact(emoji); }}
                trigger={
                  <button className="text-lg p-1 rounded-lg hover:bg-muted transition-colors w-8 h-8 flex items-center justify-center text-muted-foreground font-bold">
                    +
                  </button>
                }
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-0.5">
              {onReply && (
                <button
                  onClick={() => { onReply(message); setMenuOpen(false); }}
                  className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg hover:bg-muted text-left"
                >
                  <Reply className="w-3.5 h-3.5" /> Reply
                </button>
              )}
              <button
                onClick={handleStar}
                className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg hover:bg-muted text-left"
                data-testid={`button-star-${message.id}`}
              >
                <Star className={`w-3.5 h-3.5 ${message.starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                {message.starred ? "Unstar" : "Star"}
              </button>
              <button
                onClick={handlePin}
                className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg hover:bg-muted text-left"
              >
                <Pin className="w-3.5 h-3.5" /> Pin
              </button>
              {isMine && (
                <>
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
                </>
              )}
            </div>
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
        {showTime && (
          <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end" : "justify-start"}`}>
            <span className="text-[10px] text-muted-foreground">{formatTime(createdAt)}</span>
            {isMine && <StatusIcon status={message.status} />}
          </div>
        )}
      </div>
    </div>
  );
}
