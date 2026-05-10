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
  subscribeToPinnedMessages,
  PinnedMessage,
  unpinMessage,
  UserPresence,
  subscribeToSharedNote,
  updateSharedNote,
  subscribeToAIMemory,
  AIMemory,
  SharedNote,
  subscribeToUserPreferences,
  saveUserPreference,
} from "@/lib/firestore";
import { uploadImage, uploadVideo, uploadDocument } from "@/lib/storage";
import { drawBadge, clearBadge } from "@/lib/faviconBadge";
import { queueMessage, getQueuedMessages, removeQueuedMessage } from "@/lib/offlineQueue";
import { MessageBubble } from "@/components/MessageBubble";
import { TypingIndicator } from "@/components/TypingIndicator";
import { EmojiPicker } from "@/components/EmojiPicker";
import { GifPicker } from "@/components/GifPicker";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { CameraCapture } from "@/components/CameraCapture";
import { ChatSettings } from "@/components/ChatSettings";
import { generatePandaReply } from "@/lib/panda";
import GamePanel from "@/components/games/GamePanel";
import { subscribePandaMemory } from "@/lib/gameFirestore";
import { GameData } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Star,
  Search,
  X,
  ChevronUp,
  Paperclip,
  Video as VideoIcon,
  FileText,
  Camera,
  Settings,
  Pin,
  Reply,
  Gamepad2,
} from "lucide-react";
import { formatDistanceToNow, differenceInDays, isSameDay } from "date-fns";

const ANNIVERSARY_DATE = new Date("2025-07-07");

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

const URL_REGEX = /https?:\/\/[^\s/$.?#].[^\s]*/i;

async function fetchLinkPreview(url: string) {
  try {
    const res = await fetch(
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    const parser = new DOMParser();
    const doc = parser.parseFromString(data.contents, "text/html");
    const getMeta = (prop: string) =>
      doc.querySelector(`meta[property="og:${prop}"]`)?.getAttribute("content") ??
      doc.querySelector(`meta[name="${prop}"]`)?.getAttribute("content") ??
      null;
    return {
      url,
      title: getMeta("title") ?? doc.title ?? url,
      description: getMeta("description") ?? "",
      image: getMeta("image"),
    };
  } catch {
    return null;
  }
}

function Sidebar({
  partnerName,
  prompt,
  onNewPrompt,
  onPlayGame,
}: {
  partnerName: string;
  prompt: string;
  onNewPrompt: () => void;
  onPlayGame: () => void;
}) {
  const [, setLocation] = useLocation();
  const daysTogether = differenceInDays(new Date(), ANNIVERSARY_DATE);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsub = subscribeToSharedNote((note: SharedNote | null) => {
      if (note) setContent(note.content);
    });
    return unsub;
  }, []);

  const handleNoteChange = (val: string) => {
    setContent(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      await updateSharedNote(val);
      setSaving(false);
    }, 800);
  };

  return (
    <div className="flex flex-col gap-3 p-4 h-full">
      {/* Days Counter */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Together
          </span>
        </div>
        <p className="text-3xl font-bold text-foreground leading-none mb-1">{daysTogether}</p>
        <p className="text-sm text-muted-foreground">days and counting</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase tracking-tight">Since July 7, 2025</p>
      </div>

      {/* Shared Corner (Prompt + Note) */}
      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 shadow-sm space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MessageCircleHeart className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Daily Spark
            </span>
          </div>
          <p className="text-sm text-foreground italic leading-relaxed mb-3">
            "{prompt}"
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full rounded-xl text-[11px] h-8 border border-primary/20 hover:bg-primary/10 transition-colors"
            onClick={onNewPrompt}
          >
            <Heart className="w-3 h-3 mr-1.5 fill-primary/20" />
            New Spark
          </Button>
        </div>

        <div className="pt-4 border-t border-primary/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Our Little Note
              </span>
            </div>
            {saving && <span className="text-[10px] text-primary animate-pulse font-medium">SAVING...</span>}
          </div>
          <textarea
            value={content}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder="Write something just for the two of you…"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none leading-relaxed min-h-[80px]"
          />
        </div>
      </div>

      <div className="flex-1" />

      <Button
        variant="outline"
        className="w-full rounded-xl gap-2 h-11 border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-semibold"
        onClick={onPlayGame}
      >
        <Gamepad2 className="w-4 h-4" />
        Play a Game
      </Button>

      <Button
        variant="outline"
        className="w-full rounded-xl gap-2 h-11 border-border/60 hover:bg-muted"
        onClick={() => setLocation("/media")}
      >
        <Paperclip className="w-4 h-4" />
        Shared Media
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
  const [gamePanelOpen, setGamePanelOpen] = useState(false);
  const [prompt, setPrompt] = useState(SWEET_PROMPTS[0]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showFileMenu, setShowFileMenu] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMatchIds, setSearchMatchIds] = useState<string[]>([]);
  const [searchIdx, setSearchIdx] = useState(0);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const [pinnedExpanded, setPinnedExpanded] = useState(false);
  const [pandaTyping, setPandaTyping] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiMemory, setAiMemory] = useState<AIMemory | null>(null);
  const [wallpaper, setWallpaper] = useState(() => localStorage.getItem("sweetalk_wallpaper") ?? "none");
  const [bubbleColor, setBubbleColor] = useState(() => localStorage.getItem("sweetalk_bubble_color") ?? "");
  const [bubbleShape, setBubbleShape] = useState(() => localStorage.getItem("sweetalk_bubble_shape") ?? "rounded");
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("sweetalk_font_size") ?? "15px");
  const [atMenuOpen, setAtMenuOpen] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);


  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAtBottomRef = useRef(true);
  const prevMsgCountRef = useRef(0);

  const { partnerUid, partnerName } = usePartnerUid();
  const partnerInitial = partnerName.includes("Mr. Kumarr") 
    ? "B" 
    : partnerName.includes("Mrs. Kumarr") 
      ? "S" 
      : partnerName.charAt(0).toUpperCase();

  useEffect(() => {
    document.documentElement.style.setProperty("--chat-font-size", fontSize);
  }, [fontSize]);

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

      const unread = msgs.filter(
        (m) => m.senderId !== user.uid && m.status !== "read"
      ).length;
      setUnreadCount(unread);

      if (msgs.length > prevMsgCountRef.current && prevMsgCountRef.current > 0) {
        const newest = msgs[msgs.length - 1];
        if (newest?.senderId !== user.uid) playChime();
        if (isAtBottomRef.current) {
          setTimeout(() => scrollToBottom(true), 50);
        } else {
          setShowScrollBtn(true);
        }
        
        // Trigger memory update check
        import("@/lib/panda").then(m => m.maybeUpdatePandaMemory(msgs, aiMemory));
      } else if (prevMsgCountRef.current === 0) {
        setTimeout(() => scrollToBottom(false), 50);
      }

      prevMsgCountRef.current = msgs.length;
    });
    return unsub;
  }, [user, playChime, scrollToBottom, aiMemory]);

  useEffect(() => {
    if (unreadCount > 0) drawBadge(unreadCount);
    else clearBadge();
  }, [unreadCount]);

  useEffect(() => {
    if (!user || !partnerUid) return;
    const unsub = subscribeToTyping(partnerUid, setPartnerTyping);
    const unsub2 = subscribeToPresence(partnerUid, setPartnerPresence);
    return () => { unsub(); unsub2(); };
  }, [user, partnerUid]);

  // Sync Game Panel visibility with shared activeGameId
  useEffect(() => {
    const unsub = subscribePandaMemory((mem) => {
      if (mem.activeGameId) {
        setGamePanelOpen(true);
        setSidebarOpen(false);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeToPinnedMessages(setPinnedMessages);
    const unsub2 = subscribeToAIMemory(setAiMemory);
    
    let unsub3: (() => void) | undefined;
    if (user) {
      unsub3 = subscribeToUserPreferences(user.uid, (prefs) => {

      });
    }
    
    return () => { 
      unsub(); 
      unsub2(); 
      if (unsub3) unsub3();
    };
  }, [user]);

  useEffect(() => {
    const base = "SweeTalk";
    document.title = unreadCount > 0 ? `(${unreadCount}) ${base}` : base;
  }, [unreadCount]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchMatchIds([]);
      return;
    }
    const term = searchTerm.toLowerCase();
    const ids = messages
      .filter((m) => m.text?.toLowerCase().includes(term))
      .map((m) => m.id);
    setSearchMatchIds(ids);
    setSearchIdx(0);
  }, [searchTerm, messages]);

  useEffect(() => {
    if (searchMatchIds.length === 0) return;
    const id = searchMatchIds[searchIdx];
    const el = document.querySelector(`[data-message-id="${id}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [searchMatchIds, searchIdx]);

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

    // Show @ menu if last char is @ or if we are typing after @
    const lastWord = val.split(" ").pop() || "";
    if (lastWord.startsWith("@")) {
      setAtMenuOpen(true);
    } else {
      setAtMenuOpen(false);
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    setTypingStatus(user.uid, true);
    typingTimerRef.current = setTimeout(() => {
      if (user) setTypingStatus(user.uid, false);
    }, 2000);
  };

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    const msg = text.trim();
    const isPandaTrigger = msg.toLowerCase().includes("@panda") || replyingTo?.isAI;
    const currentReply = replyingTo; // Capture it before clearing

    setText("");
    setReplyingTo(null);
    setAtMenuOpen(false);
    setTypingStatus(user.uid, false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    const tempId = `temp-${Date.now()}`;
    const pendingMsg: Message = {
      id: tempId,
      senderId: user.uid,
      text: msg,
      type: "text",
      createdAt: { toDate: () => new Date() } as any,
      status: "sending",
      edited: false,
      deleted: false,
      reactions: {},
      replyTo: currentReply
        ? { 
            id: currentReply.id, 
            text: currentReply.text ?? "[media]", 
            senderId: currentReply.senderId,
            type: currentReply.type,
            gameName: currentReply.gameData?.gameName,
            emoji: currentReply.gameData?.emoji,
          }
        : null,
      starred: false,
      isAI: false,
      linkPreview: null,
    };

    setPendingMessages(prev => [...prev, pendingMsg]);

    try {
      const urlMatch = msg.match(URL_REGEX);
      let linkPreview = null;
      if (urlMatch) {
        linkPreview = await fetchLinkPreview(urlMatch[0]);
      }

      await sendMessage(user.uid, {
        text: msg,
        type: "text",
        replyTo: currentReply
          ? { 
              id: currentReply.id, 
              text: currentReply.text ?? "[media]", 
              senderId: currentReply.senderId,
              type: currentReply.type,
              gameName: currentReply.gameData?.gameName,
              emoji: currentReply.gameData?.emoji,
            }
          : null,
        linkPreview,
      });
      setPendingMessages(prev => prev.filter(m => m.id !== tempId));
    } catch (err) {
      console.error("Send failed:", err);
      setPendingMessages(prev => prev.filter(m => m.id !== tempId));
    }

    if (isPandaTrigger) {
      // Clean input: Remove "@panda" and trim
      const cleanMsg = msg.replace(/@panda/gi, "").trim();
      
      // Show "Panda is typing..."
      setPandaTyping(true);
      
      // Natural delay (simulate thinking: 1-3 seconds)
      const thinkingDelay = Math.floor(Math.random() * 1500) + 1000;
      
      setTimeout(async () => {
        try {
          const cleanUserDisplayName = (user.displayName || "User")
            .replace(/sbharathkumar1125|Mr\.?\s*Kumarr*/gi, "Bharath Kumar")
            .replace(/saiswetharr|Mrs\.?\s*Kumarr*/gi, "Saiswetha");

          const replyText = await generatePandaReply(
            user.uid,
            cleanUserDisplayName,
            partnerName,
            messages.slice(-50), // Last 50 messages for context
            cleanMsg,
            currentReply ? { id: currentReply.id, text: currentReply.text ?? "[media]", senderId: currentReply.senderId } : null
          );

          await sendMessage(user.uid, {
            text: replyText,
            type: "text",
            isAI: true,
            replyTo: currentReply
              ? { id: currentReply.id, text: currentReply.text ?? "[media]", senderId: currentReply.senderId }
              : null,
          });
        } finally {
          setPandaTyping(false);
        }
      }, thinkingDelay);
    }

    setTimeout(() => scrollToBottom(true), 50);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const tempId = `temp-${Date.now()}`;
    const pendingMsg: Message = {
      id: tempId,
      senderId: user.uid,
      text: null,
      type: "image",
      imageUrl: URL.createObjectURL(file),
      createdAt: { toDate: () => new Date() } as any,
      status: "sending",
      edited: false,
      deleted: false,
      reactions: {},
      replyTo: null,
      starred: false,
      localPath: URL.createObjectURL(file),
    };
    setPendingMessages(prev => [...prev, pendingMsg]);

    setUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadImage(file, setUploadProgress);
      await sendMessage(user.uid, { type: "image", imageUrl: url });
      setPendingMessages(prev => prev.filter(m => m.id !== tempId));
      setTimeout(() => scrollToBottom(true), 50);
    } catch (err) {
      console.error("Upload failed:", err);
      setPendingMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = "";
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 100 * 1024 * 1024) {
      alert("Video must be under 100MB");
      return;
    }
    const tempId = `temp-${Date.now()}`;
    const pendingMsg: Message = {
      id: tempId,
      senderId: user.uid,
      text: null,
      type: "video",
      videoUrl: URL.createObjectURL(file),
      createdAt: { toDate: () => new Date() } as any,
      status: "sending",
      edited: false,
      deleted: false,
      reactions: {},
      replyTo: null,
      starred: false,
    };
    setPendingMessages(prev => [...prev, pendingMsg]);

    setUploading(true);
    setUploadProgress(0);
    setShowFileMenu(false);
    try {
      const url = await uploadVideo(file, setUploadProgress);
      await sendMessage(user.uid, { type: "video", videoUrl: url });
      setPendingMessages(prev => prev.filter(m => m.id !== tempId));
      setTimeout(() => scrollToBottom(true), 50);
    } catch (err) {
      console.error("Upload failed:", err);
      setPendingMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = "";
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const tempId = `temp-${Date.now()}`;
    const pendingMsg: Message = {
      id: tempId,
      senderId: user.uid,
      text: null,
      type: "document",
      documentName: file.name,
      documentSize: file.size,
      documentUrl: "#",
      createdAt: { toDate: () => new Date() } as any,
      status: "sending",
      edited: false,
      deleted: false,
      reactions: {},
      replyTo: null,
      starred: false,
    };
    setPendingMessages(prev => [...prev, pendingMsg]);

    setUploading(true);
    setUploadProgress(0);
    setShowFileMenu(false);
    try {
      const url = await uploadDocument(file, setUploadProgress);
      await sendMessage(user.uid, {
        type: "document",
        documentUrl: url,
        documentName: file.name,
        documentSize: file.size,
      });
      setPendingMessages(prev => prev.filter(m => m.id !== tempId));
      setTimeout(() => scrollToBottom(true), 50);
    } catch (err) {
      console.error("Upload failed:", err);
      setPendingMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = "";
    }
  };

  const handleVoiceReady = async (url: string) => {
    if (!user) return;
    const tempId = `temp-${Date.now()}`;
    const pendingMsg: Message = {
      id: tempId,
      senderId: user.uid,
      text: null,
      type: "voice",
      voiceUrl: url,
      createdAt: { toDate: () => new Date() } as any,
      status: "sending",
      edited: false,
      deleted: false,
      reactions: {},
      replyTo: null,
      starred: false,
    };
    setPendingMessages(prev => [...prev, pendingMsg]);

    try {
      await sendMessage(user.uid, { type: "voice", voiceUrl: url });
      setPendingMessages(prev => prev.filter(m => m.id !== tempId));
      setTimeout(() => scrollToBottom(true), 50);
    } catch (err) {
      setPendingMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const handleCameraCapture = async (blob: Blob, type: "image" | "video") => {
    if (!user) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      let url = "";
      if (type === "image") {
        url = await uploadImage(new File([blob], "camera-capture.jpg", { type: "image/jpeg" }), setUploadProgress);
        await sendMessage(user.uid, { type: "image", imageUrl: url });
      } else {
        url = await uploadVideo(new File([blob], "camera-capture.webm", { type: "video/webm" }), setUploadProgress);
        await sendMessage(user.uid, { type: "video", videoUrl: url });
      }
      setTimeout(() => scrollToBottom(true), 50);
    } catch (err) {
      console.error("Capture upload failed:", err);
      alert("Failed to upload capture. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
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

  const handleJumpTo = (id: string) => {
    const el = document.querySelector(`[data-message-id="${id}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSendGameMessage = async (gameData: GameData) => {
    if (!user) return;
    const tempId = `temp-${Date.now()}`;
    const pendingMsg: Message = {
      id: tempId,
      senderId: user.uid,
      text: `${gameData.emoji} ${gameData.gameName}: ${gameData.result}`,
      type: "game",
      gameData,
      createdAt: { toDate: () => new Date() } as any,
      status: "sending",
      edited: false,
      deleted: false,
      reactions: {},
      replyTo: null,
      starred: false,
    };
    setPendingMessages(prev => [...prev, pendingMsg]);

    try {
      await sendMessage(user.uid, {
        type: "game",
        text: `${gameData.emoji} ${gameData.gameName}: ${gameData.result}`,
        gameData,
      });
      setPendingMessages(prev => prev.filter(m => m.id !== tempId));
      setTimeout(() => scrollToBottom(true), 50);
    } catch (err) {
      setPendingMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const handleSendGif = async (gif: { url: string; preview?: string; width?: number; height?: number }) => {
    if (!user) return;
    const tempId = `temp-${Date.now()}`;
    const pendingMsg: Message = {
      id: tempId,
      senderId: user.uid,
      text: null,
      type: "gif",
      gifUrl: gif.url,
      previewUrl: gif.preview,
      width: gif.width,
      height: gif.height,
      createdAt: { toDate: () => new Date() } as any,
      status: "sending",
      edited: false,
      deleted: false,
      reactions: {},
      replyTo: null,
      starred: false,
    };
    setPendingMessages(prev => [...prev, pendingMsg]);

    try {
      await sendMessage(user.uid, {
        type: "gif",
        gifUrl: gif.url,
        previewUrl: gif.preview,
        width: gif.width,
        height: gif.height,
        source: "web-picker",
      });
      setPendingMessages(prev => prev.filter(m => m.id !== tempId));
      setTimeout(() => scrollToBottom(true), 50);
    } catch (err) {
      setPendingMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const handleWallpaperChange = (v: string) => {
    setWallpaper(v);
    localStorage.setItem("sweetalk_wallpaper", v);
  };

  const handleBubbleColorChange = (v: string) => {
    setBubbleColor(v);
    localStorage.setItem("sweetalk_bubble_color", v);
  };

  const handleBubbleShapeChange = (v: string) => {
    setBubbleShape(v);
    localStorage.setItem("sweetalk_bubble_shape", v);
  };

  const handleFontSizeChange = (v: string) => {
    setFontSize(v);
    localStorage.setItem("sweetalk_font_size", v);
    document.documentElement.style.setProperty("--chat-font-size", v);
  };



  const presenceLabel = partnerPresence
    ? partnerPresence.online
      ? "Online"
      : partnerPresence.lastSeen
      ? `Last seen ${formatDistanceToNow(partnerPresence.lastSeen.toDate(), { addSuffix: true })}`
      : "Offline"
    : "Offline";

  const wallpaperStyle = wallpaper && wallpaper !== "none"
    ? wallpaper.startsWith("url(")
      ? { backgroundImage: wallpaper, backgroundSize: "cover", backgroundPosition: "center" }
      : { backgroundImage: wallpaper }
    : undefined;

  const DateSeparator = ({ date }: { date: Date }) => (
    <div className="flex items-center gap-4 py-6 px-10">
      <div className="flex-1 h-px bg-border/40" />
      <div className="px-3 py-1 rounded-full bg-muted/50 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
        {isToday(date) ? "Today" : isYesterday(date) ? "Yesterday" : format(date, "MMMM d, yyyy")}
      </div>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  );

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
          <p className="font-semibold text-foreground leading-tight truncate">
            {partnerName}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {partnerPresence?.online && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            )}
            {presenceLabel}
          </p>
        </div>
        <div className="flex items-center gap-1">

          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl text-muted-foreground"
            onClick={() => setLocation("/starred")}
            title="Starred messages"
          >
            <Star className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl text-muted-foreground"
            onClick={() => setSearchOpen((v) => !v)}
            title="Search"
          >
            <Search className="w-4 h-4" />
          </Button>
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
            variant="ghost"
            size="icon"
            className="rounded-xl text-muted-foreground"
            onClick={() => setSettingsOpen(true)}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-xl hidden md:flex ${gamePanelOpen ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
            onClick={() => { setGamePanelOpen((v) => !v); if (!gamePanelOpen) setSidebarOpen(false); }}
            title="Play a game"
          >
            <Gamepad2 className="w-4 h-4" />
          </Button>
          <Button
            data-testid="button-sidebar-toggle"
            variant="ghost"
            size="icon"
            className="rounded-xl text-muted-foreground hidden md:flex"
            onClick={() => { setSidebarOpen((v) => !v); setGamePanelOpen(false); }}
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

      {/* Search bar */}
      {searchOpen && (
        <div className="flex-shrink-0 bg-card/80 backdrop-blur border-b border-border px-3 py-2 flex items-center gap-2 animate-in slide-in-from-top-2">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") { setSearchOpen(false); setSearchTerm(""); }
            }}
            placeholder="Search messages…"
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
          {searchTerm && (
            <span className="text-xs text-muted-foreground">
              {searchMatchIds.length} result{searchMatchIds.length !== 1 ? "s" : ""}
            </span>
          )}
          {searchMatchIds.length > 1 && (
            <>
              <button
                onClick={() => setSearchIdx((i) => (i - 1 + searchMatchIds.length) % searchMatchIds.length)}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSearchIdx((i) => (i + 1) % searchMatchIds.length)}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={() => { setSearchOpen(false); setSearchTerm(""); }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Game panel — left */}
        {gamePanelOpen && (
          <aside className="hidden md:flex flex-col w-80 border-r border-border bg-background overflow-hidden flex-shrink-0">
            <GamePanel
              uid={user?.uid ?? ""}
              partnerUid={partnerUid}
              partnerName={partnerName}
              myName={(user?.displayName ?? "You").replace(/sbharathkumar1125|Mr\.?\s*Kumarr*/gi, "Bharath Kumar").replace(/saiswetharr|Mrs\.?\s*Kumarr*/gi, "Saiswetha")}
              onSendToChat={handleSendGameMessage}
              onClose={() => setGamePanelOpen(false)}
            />
          </aside>
        )}

        {/* Main chat column */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Pinned messages */}
          {pinnedMessages.length > 0 && (
            <div className="flex-shrink-0 bg-card/60 border-b border-border px-4 py-2">
              {pinnedMessages.length === 1 ? (
                <div className="flex items-center gap-2">
                  <Pin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="text-xs text-foreground flex-1 truncate">
                    {pinnedMessages[0].messageText}
                  </span>
                  <button
                    onClick={() => handleJumpTo(pinnedMessages[0].messageId)}
                    className="text-xs text-primary hover:opacity-80"
                  >
                    Jump
                  </button>
                  <button
                    onClick={() => unpinMessage(pinnedMessages[0].messageId)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setPinnedExpanded((v) => !v)}
                    className="flex items-center gap-2 w-full text-left"
                  >
                    <Pin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="text-xs text-foreground flex-1">
                      📌 {pinnedMessages.length} pinned messages
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${pinnedExpanded ? "rotate-180" : ""}`} />
                  </button>
                  {pinnedExpanded && (
                    <div className="mt-2 space-y-1.5 animate-in slide-in-from-top-2">
                      {pinnedMessages.map((pm) => (
                        <div key={pm.id} className="flex items-center gap-2 pl-5">
                          <span className="text-xs text-foreground flex-1 truncate">{pm.messageText}</span>
                          <button
                            onClick={() => handleJumpTo(pm.messageId)}
                            className="text-xs text-primary hover:opacity-80"
                          >
                            Jump
                          </button>
                          <button
                            onClick={() => unpinMessage(pm.messageId)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Messages */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto py-2 relative"
            style={wallpaperStyle}
          >
            {wallpaperStyle && (
              <div className="absolute inset-0 bg-background/60 pointer-events-none" />
            )}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-8 relative">
                <Heart className="w-10 h-10 text-primary/40 fill-current mb-3" />
                <p className="text-muted-foreground text-sm">
                  Your conversation starts here. Say something sweet.
                </p>
              </div>
            )}

            {[...messages, ...pendingMessages].map((msg, idx, allArray) => {
              const prev = allArray[idx - 1];
              const next = allArray[idx + 1];
              
              const isMine = msg.senderId === user?.uid;
              const isSameAsPrev = prev && prev.senderId === msg.senderId;
              const isSameAsNext = next && next.senderId === msg.senderId;
              
              const timeDiffPrev = prev 
                ? (msg.createdAt?.toDate?.().getTime() ?? 0) - (prev.createdAt?.toDate?.().getTime() ?? 0)
                : Infinity;
              const timeDiffNext = next
                ? (next.createdAt?.toDate?.().getTime() ?? 0) - (msg.createdAt?.toDate?.().getTime() ?? 0)
                : Infinity;

              // Show time if:
              // 1. First message
              // 2. Different sender from next
              // 3. Gap > 1 min to next
              const showTime = !isSameAsNext || timeDiffNext > 60000;
              const createdAtDate = msg.createdAt?.toDate?.() ?? new Date();
              const prevDate = prev?.createdAt?.toDate?.() ?? null;
              const showDateSeparator = !prevDate || !isSameDay(prevDate, createdAtDate);

              return (
                <div key={msg.id} className="relative">
                  {showDateSeparator && <DateSeparator date={createdAtDate} />}
                  <MessageBubble
                    message={msg}
                    isMine={isMine}
                    myUid={user?.uid ?? ""}
                    searchTerm={searchOpen ? searchTerm : undefined}
                    onReply={setReplyingTo}
                    onJumpTo={handleJumpTo}
                    bubbleColor={bubbleColor}
                    bubbleShape={bubbleShape}
                    fontSize={fontSize}
                    showTime={showTime}
                    isGrouped={isSameAsNext}
                  />
                </div>
              );
            })}

            {pandaTyping && (
              <div className="flex items-center gap-2 px-4 py-2 animate-in fade-in slide-in-from-bottom-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg">🐼</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-medium text-primary uppercase tracking-wider">Panda</span>
                  <TypingIndicator hideLabel />
                </div>
              </div>
            )}

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

          {/* Upload progress */}
          {uploading && (
            <div className="flex-shrink-0 bg-card/80 border-t border-border px-4 py-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Uploading…</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{Math.round(uploadProgress)}%</span>
              </div>
            </div>
          )}

          {/* Reply preview */}
          {replyingTo && (
            <div className="flex-shrink-0 bg-card/80 border-t border-border px-4 py-2 flex items-center gap-2">
              <Reply className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0 border-l-2 border-primary pl-2">
                <p className="text-xs font-medium text-primary">
                  {replyingTo.senderId === user?.uid ? "You" : partnerName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {replyingTo.text ?? "[media]"}
                </p>
              </div>
              <button onClick={() => setReplyingTo(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* @ autocomplete menu */}
          {atMenuOpen && (
            <div className="flex-shrink-0 bg-card/80 backdrop-blur-md border-t border-border/50 px-3 py-3 animate-in slide-in-from-bottom-3 fade-in duration-300">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 hover:border-primary/40 transition-all group shadow-sm active:scale-[0.98]"
                onClick={() => {
                  const words = text.split(" ");
                  words[words.length - 1] = "@panda ";
                  setText(words.join(" "));
                  setAtMenuOpen(false);
                  inputRef.current?.focus();
                }}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <span className="text-xl">🐼</span>
                </div>
                <div className="flex flex-col items-start gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">@panda</span>
                    <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full uppercase font-black tracking-tighter">AI Assistant</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">Ask me anything or tag for a quick response</span>
                </div>
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronUp className="w-4 h-4 text-primary animate-bounce-subtle" />
                </div>
              </button>
            </div>
          )}

          {/* Input */}
          <div className="flex-shrink-0 bg-card/80 backdrop-blur border-t border-border px-3 py-3">
            <div className="flex items-end gap-2">
              <EmojiPicker onSelect={handleEmojiSelect} />
              
              <GifPicker 
                onSelect={handleSendGif}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="rounded-xl text-muted-foreground hover:text-foreground"
                    title="Send GIF"
                  >
                    <span className="text-[10px] font-black border-2 border-current px-0.5 rounded leading-none">GIF</span>
                  </Button>
                }
              />

              <Button
                variant="ghost"
                size="icon"
                type="button"
                className="rounded-xl text-muted-foreground hover:text-foreground"
                onClick={() => setShowCamera(true)}
                title="Take photo or video"
              >
                <Camera className="w-5 h-5" />
              </Button>

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

              {/* File picker */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className="rounded-xl text-muted-foreground hover:text-foreground"
                  onClick={() => setShowFileMenu((v) => !v)}
                  disabled={uploading}
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                {showFileMenu && (
                  <div className="absolute bottom-10 left-0 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-30 min-w-[160px]">
                    <label className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted cursor-pointer">
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleVideoUpload}
                      />
                      <VideoIcon className="w-4 h-4 text-muted-foreground" />
                      Video
                    </label>
                    <label className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                        className="hidden"
                        onChange={handleDocUpload}
                      />
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      Document
                    </label>
                  </div>
                )}
              </div>

              <VoiceRecorder onVoiceReady={handleVoiceReady} />

              <div className="flex-1">
                <Input
                  ref={inputRef}
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
        {sidebarOpen && !gamePanelOpen && (
          <aside className="hidden md:flex flex-col w-72 border-l border-border bg-background overflow-y-auto flex-shrink-0">
            <Sidebar
              partnerName={partnerName}
              prompt={prompt}
              onNewPrompt={handleNewPrompt}
              onPlayGame={() => { setGamePanelOpen(true); setSidebarOpen(false); }}
            />
          </aside>
        )}
      </div>

      {/* Click outside to close file menu */}
      {showFileMenu && (
        <div className="fixed inset-0 z-20" onClick={() => setShowFileMenu(false)} />
      )}

      {/* Chat Settings panel */}
      <ChatSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        wallpaper={wallpaper}
        onWallpaperChange={handleWallpaperChange}
        bubbleColor={bubbleColor}
        onBubbleColorChange={handleBubbleColorChange}
        bubbleShape={bubbleShape}
        onBubbleShapeChange={handleBubbleShapeChange}
        fontSize={fontSize}
        onFontSizeChange={handleFontSizeChange}
      />

      <CameraCapture
        open={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
}
