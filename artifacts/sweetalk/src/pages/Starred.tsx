import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToStarredMessages, Message } from "@/lib/firestore";
import { MessageBubble } from "@/components/MessageBubble";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star } from "lucide-react";

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
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/chat")}
          className="rounded-xl"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-primary fill-current" />
          <h1 className="font-semibold text-foreground">Starred Messages</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Star className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No starred messages yet</p>
            <p className="text-xs text-muted-foreground/60">Long-press a message to star it</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={msg.senderId === user?.uid}
              myUid={user?.uid ?? ""}
            />
          ))
        )}
      </div>
    </div>
  );
}
