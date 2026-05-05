import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { PandaAvatar, PandaThinking } from "./PandaAvatar";
import { askPanda } from "@/lib/panda";
import type { GameComponentProps } from "./GamePanel";

interface Message {
  role: "user" | "panda";
  text: string;
}

const STARTER_PROMPTS = [
  "What game should we play right now? 🎮",
  "Give us a fun date night idea 🌙",
  "How can we connect better today? 💕",
  "Tell us something sweet about long-distance love 💌",
  "Give us a challenge for this week 🌟",
];

export function AskPanda({ uid, partnerUid, partnerName, myName, memory, onSendToChat, onComplete }: GameComponentProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "panda", text: `Hey ${myName}! 🐼 I'm Panda, your personal couples AI. Ask me anything — games, date ideas, relationship advice, or just say hi!` },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || thinking) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setThinking(true);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    try {
      const context = `${myName} and ${partnerName} are a couple using SweeTalk. Recent games: ${memory.gameHistory.slice(0, 3).map((h) => h.game).join(", ") || "none yet"}.`;
      const reply = await askPanda(msg, memory, context);
      setMessages((prev) => [...prev, { role: "panda", text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "panda", text: "I'm having a little moment… Try again? 🐼💕" }]);
    } finally {
      setThinking(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "panda" && <PandaAvatar size="sm" />}
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "panda"
                  ? "bg-primary/10 text-foreground rounded-tl-sm"
                  : "bg-primary text-primary-foreground rounded-tr-sm"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex gap-2 justify-start">
            <PandaAvatar size="sm" thinking />
            <div className="bg-primary/10 rounded-2xl px-3.5 py-3 rounded-tl-sm mt-6">
              <div className="flex gap-1">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length === 1 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-0.5">Try asking…</p>
          {STARTER_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              className="text-xs bg-muted/60 hover:bg-primary/10 border border-border rounded-xl px-3 py-2 text-left text-foreground transition-colors hover:border-primary"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-center flex-shrink-0">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask Panda anything…"
          className="rounded-2xl flex-1"
          disabled={thinking}
        />
        <Button
          size="icon"
          onClick={() => send()}
          disabled={!input.trim() || thinking}
          className="rounded-2xl flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
