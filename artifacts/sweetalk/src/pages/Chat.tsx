import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useSound } from "@/hooks/useSound";
import { usePartnerUid } from "@/hooks/usePartnerUid";
import {
  Message,
  subscribeToMessages,
  sendMessage,
  setTypingStatus,
  subscribeToTyping,
  subscribeToPresence,
  markMessagesRead,
  UserPresence,
} from "@/lib/firestore";
import { uploadImage } from "@/lib/storage";
import { MessageBubble } from "@/components/MessageBubble";
import { TypingIndicator } from "@/components/TypingIndicator";
import { SharedNote } from "@/components/SharedNote";
import { EmojiPicker } from "@/components/EmojiPicker";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Moon,
  Sun,
  Send,
  Image as ImageIcon,
  LogOut,
  ChevronDown,
  ImageIcon as AlbumIcon,
  Volume2,
  VolumeX,
  Heart,
  CalendarDays,
  MessageCircleHeart,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";
import { formatDistanceToNow, differenceInDays } from "date-fns";

const ANNIVERSARY_DATE = new Date("2024-06-01");

const SWEET_PROMPTS = [
  "If I could describe you in three words, they'd be...",
  "My favorite memory of us together is...",
  "Something I love watching you do is...",
  "You make me feel safe when...",
  "I was thinking about you today because...",
  "A song that makes me think of you is...",
  "The thing I'm most looking forward to doing with you is...",
  "You always know how to make me smile when...",
  "I fell a little more in love with you when...",
  "What I appreciate most about you right now is...",
];

function Sidebar({
  partnerName,
  prompt,
  onNewPrompt,
}: {
  partnerName: string;
  prompt: string;
  onNewPrompt: () => void;
}) {
  const [, setLocation] = useLocation();
  const daysTogether = differenceInDays(new Date(), ANNIVERSARY_DATE);

  return (
    <div className="flex flex-col gap-3 p-4 h-full">
      {/* Anniversary */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Together
          </span>
        </div>
        <p className="text-3xl font-bold text-foreground">{daysTogether}</p>
        <p className="text-sm text-muted-foreground">days and counting</p>
        <p className="text-xs text-muted-foreground mt-1">Since June 1, 2024</p>
      </div>

      {/* Thinking of You */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircleHeart className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Conversation Starter
          </span>
        </div>
        <p className="text-sm text-foreground italic leading-relaxed mb-3">
          "{prompt}"
        </p>
        <Button
          data-testid="button-new-prompt"
          variant="outline"
          size="sm"
          className="w-full rounded-xl text-xs"
          onClick={onNewPrompt}
        >
          <Heart className="w-3.5 h-3.5 mr-1.5" />
          New prompt
        </Button>
      </div>

      {/* Photo Album */}
      <Button
        data-testid="button-album"
        variant="outline"
        className="w-full rounded-xl gap-2"
        onClick={() => setLocation("/album")}
      >
        <AlbumIcon className="w-4 h-4" />
        Our Photo Album
      </Button>
    </div>
  );
}

export default function Chat() {
  const { user, signOut } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const { playChime, toggleSound, isSoundEnabled } = useSound();
  const [, setLocation] = useLocation();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerPresence, setPartnerPresence] = useState<UserPresence | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [prompt, setPrompt] = useState(SWEET_PROMPTS[0]);
  const [uploading, setUploading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAtBottomRef = useRef(true);
  const prevMsgCountRef = useRef(0);

  const { partnerUid, partnerName } = usePartnerUid();

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    setShowScrollBtn(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToMessages((msgs) => {
      setMessages(msgs);

      const incoming = msgs.filter(
        (m) => m.senderId !== user.uid && m.status !== "read"
      );
      if (incoming.length > 0 && isAtBottomRef.current) {
        markMessagesRead(incoming.map((m) => m.id));
      }

      setUnreadCount(
        msgs.filter((m) => m.senderId !== user.uid && m.status !== "read").length
      );

      if (msgs.length > prevMsgCountRef.current && prevMsgCountRef.current > 0) {
        const newest = msgs[msgs.length - 1];
        if (newest?.senderId !== user.uid) {
          playChime();
        }
        if (isAtBottomRef.current) {
          setTimeout(() => scrollToBottom(true), 50);
        } else {
          setShowScrollBtn(true);
        }
      } else if (prevMsgCountRef.current === 0) {
        setTimeout(() => scrollToBottom(false), 50);
      }

      prevMsgCountRef.current = msgs.length;
    });
    return unsub;
  }, [user, playChime, scrollToBottom]);

  useEffect(() => {
    if (!user || !partnerUid) return;
    const unsub = subscribeToTyping(partnerUid, setPartnerTyping);
    const unsub2 = subscribeToPresence(partnerUid, setPartnerPresence);
    return () => { unsub(); unsub2(); };
  }, [user, partnerUid]);

  useEffect(() => {
    const base = "SweeTalk";
    document.title = unreadCount > 0 ? `(${unreadCount}) ${base}` : base;
  }, [unreadCount]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    isAtBottomRef.current = atBottom;
    setShowScrollBtn(!atBottom);

    if (atBottom && user) {
      const unread = messages.filter(
        (m) => m.senderId !== user.uid && m.status !== "read"
      );
      if (unread.length > 0) markMessagesRead(unread.map((m) => m.id));
    }
  }, [messages, user]);

  const handleTyping = (val: string) => {
    setText(val);
    if (!user) return;
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    setTypingStatus(user.uid, true);
    typingTimerRef.current = setTimeout(() => {
      if (user) setTypingStatus(user.uid, false);
    }, 2000);
  };

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    const msg = text.trim();
    setText("");
    setTypingStatus(user.uid, false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    await sendMessage(user.uid, { text: msg, type: "text" });
    setTimeout(() => scrollToBottom(true), 50);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      await sendMessage(user.uid, { type: "image", imageUrl: url });
      setTimeout(() => scrollToBottom(true), 50);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleVoiceReady = async (url: string) => {
    if (!user) return;
    await sendMessage(user.uid, { type: "voice", voiceUrl: url });
    setTimeout(() => scrollToBottom(true), 50);
  };

  const handleEmojiSelect = (emoji: string) => {
    setText((t) => t + emoji);
  };

  const handleToggleSound = () => {
    const newVal = toggleSound();
    setSoundOn(newVal);
  };

  const handleNewPrompt = () => {
    setPrompt(SWEET_PROMPTS[Math.floor(Math.random() * SWEET_PROMPTS.length)]);
  };

  const partnerInitial = partnerName.charAt(0).toUpperCase();

  const presenceLabel = partnerPresence
    ? partnerPresence.online
      ? "Online"
      : partnerPresence.lastSeen
      ? `Last seen ${formatDistanceToNow(partnerPresence.lastSeen.toDate(), { addSuffix: true })}`
      : "Offline"
    : "Offline";

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-card/80 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3 shadow-sm z-10">
        <Avatar className="w-9 h-9 ring-2 ring-primary/30">
          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
            {partnerInitial}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground leading-tight truncate">{partnerName}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {partnerPresence?.online && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            )}
            {presenceLabel}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            data-testid="button-sound-toggle"
            variant="ghost"
            size="icon"
            className="rounded-xl text-muted-foreground"
            onClick={handleToggleSound}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          <Button
            data-testid="button-theme-toggle"
            variant="ghost"
            size="icon"
            className="rounded-xl text-muted-foreground"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button
            data-testid="button-sidebar-toggle"
            variant="ghost"
            size="icon"
            className="rounded-xl text-muted-foreground hidden md:flex"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            {sidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </Button>
          <Button
            data-testid="button-signout"
            variant="ghost"
            size="icon"
            className="rounded-xl text-muted-foreground"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main chat column */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Shared note */}
          <SharedNote />

          {/* Messages */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto py-2 relative"
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <Heart className="w-10 h-10 text-primary/40 fill-current mb-3" />
                <p className="text-muted-foreground text-sm">
                  Your conversation starts here. Say something sweet.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMine={msg.senderId === user?.uid}
                myUid={user?.uid ?? ""}
              />
            ))}

            {partnerTyping && <TypingIndicator partnerName={partnerName} />}
            <div ref={bottomRef} />
          </div>

          {/* Scroll to bottom button */}
          {showScrollBtn && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
              <Button
                data-testid="button-scroll-bottom"
                size="sm"
                className="rounded-full shadow-lg gap-1.5 text-xs"
                onClick={() => scrollToBottom(true)}
              >
                <ChevronDown className="w-3.5 h-3.5" />
                {unreadCount > 0 ? `${unreadCount} new` : "New messages"}
              </Button>
            </div>
          )}

          {/* Input */}
          <div className="flex-shrink-0 bg-card/80 backdrop-blur border-t border-border px-3 py-3">
            <div className="flex items-end gap-2">
              <EmojiPicker onSelect={handleEmojiSelect} />

              {/* Image upload */}
              <label data-testid="button-image-upload" className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className={`rounded-xl pointer-events-none ${uploading ? "text-primary animate-pulse" : "text-muted-foreground hover:text-foreground"}`}
                  tabIndex={-1}
                >
                  <ImageIcon className="w-5 h-5" />
                </Button>
              </label>

              <VoiceRecorder onVoiceReady={handleVoiceReady} />

              <div className="flex-1">
                <Input
                  data-testid="input-message"
                  value={text}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                  }}
                  placeholder="Say something sweet…"
                  className="rounded-2xl border-border bg-background focus-visible:ring-primary/40"
                />
              </div>

              <Button
                data-testid="button-send"
                size="icon"
                className="rounded-2xl flex-shrink-0"
                onClick={handleSend}
                disabled={!text.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="hidden md:flex flex-col w-72 border-l border-border bg-background overflow-y-auto flex-shrink-0">
            <Sidebar
              partnerName={partnerName}
              prompt={prompt}
              onNewPrompt={handleNewPrompt}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
