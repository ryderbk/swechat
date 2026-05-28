import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToStarredMessages, Message } from "@/lib/firestore";
import { MessageBubble } from "@/components/MessageBubble";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star } from "lucide-react";
import { FloatingSparkles } from "@/components/FloatingSparkles";

export default function Starred() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToStarredMessages((msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <div className="h-full max-h-full bg-background flex flex-col relative overflow-hidden">
      {/* Sparkles background for the starry effect */}
      <FloatingSparkles />

      <div className="sticky top-0 z-20 bg-background/60 backdrop-blur-xl border-b border-primary/10 px-4 py-3 flex items-center gap-3 shadow-sm animate-fade-in">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/chat")}
          className="rounded-full w-10 h-10 hover:scale-105 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Star className="w-4 h-4 text-primary fill-current animate-pulse-glow" />
          </div>
          <h1 className="font-serif font-bold text-xl text-foreground drop-shadow-sm">Starred Messages</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-2 z-10 animate-fade-in-up">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-center p-6 glass-card rounded-2xl max-w-xs mx-auto mt-20 border border-primary/15 shadow-romantic">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-1 animate-float">
              <Star className="w-8 h-8 text-primary/60" />
            </div>
            <p className="text-foreground font-serif font-semibold text-lg">No Starred Messages</p>
            <p className="text-muted-foreground text-sm">
              Long-press a chat message to star it, saving your special moments here.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full space-y-2">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMine={msg.senderId === user?.uid && !msg.isAI}
                myUid={user?.uid ?? ""}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
