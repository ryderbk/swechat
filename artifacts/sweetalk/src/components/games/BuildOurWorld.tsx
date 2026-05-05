import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getOurWorld, subscribeOurWorld } from "@/lib/gameFirestore";
import { askPanda } from "@/lib/panda";
import { PandaBubble } from "./PandaAvatar";
import type { GameComponentProps } from "./GamePanel";

const WORLD_ITEMS = [
  { id: "treehouse",   emoji: "🏡", label: "Tree House",    threshold: 5,   desc: "Your first home together" },
  { id: "garden",      emoji: "🌸", label: "Love Garden",   threshold: 10,  desc: "Blooming with memories" },
  { id: "lake",        emoji: "🌊", label: "Peaceful Lake",  threshold: 20,  desc: "Where you find calm together" },
  { id: "stars",       emoji: "⭐", label: "Star Path",     threshold: 30,  desc: "Your dreams mapped in stars" },
  { id: "lighthouse",  emoji: "🔦", label: "Lighthouse",    threshold: 50,  desc: "Always guiding each other home" },
  { id: "rainbow",     emoji: "🌈", label: "Rainbow Bridge", threshold: 75,  desc: "Every storm led to this" },
  { id: "mountain",    emoji: "⛰️", label: "Love Mountain",  threshold: 100, desc: "You climbed every obstacle together" },
  { id: "castle",      emoji: "🏰", label: "Dream Castle",  threshold: 150, desc: "Your fairy tale made real" },
  { id: "island",      emoji: "🏝️", label: "Private Island", threshold: 200, desc: "A paradise only you two share" },
  { id: "galaxy",      emoji: "🌌", label: "Our Galaxy",    threshold: 300, desc: "Your love is infinite" },
];

export function BuildOurWorld({ uid, partnerUid, partnerName, myName, memory, onSendToChat, onComplete }: GameComponentProps) {
  const [world, setWorld] = useState<{ unlockedItems: string[]; totalRounds: number }>({ unlockedItems: [], totalRounds: 0 });
  const [pandaComment, setPandaComment] = useState("");
  const [lastUnlocked, setLastUnlocked] = useState<typeof WORLD_ITEMS[0] | null>(null);

  useEffect(() => {
    getOurWorld().then((w) => {
      setWorld(w);
      checkUnlocks(w);
    });
    const unsub = subscribeOurWorld((w) => {
      setWorld(w);
      checkUnlocks(w);
    });
    return unsub;
  }, []);

  const checkUnlocks = async (w: { unlockedItems: string[]; totalRounds: number }) => {
    const rounds = w.totalRounds ?? (memory.gameHistory.length);
    for (const item of WORLD_ITEMS) {
      if (rounds >= item.threshold && !w.unlockedItems.includes(item.id)) {
        const comment = await askPanda(
          `${myName} and ${partnerName} just unlocked "${item.label}" (${item.desc}) in their world after playing ${rounds} game rounds. Give a magical 1-sentence celebration. Max 20 words.`,
          memory
        );
        setPandaComment(comment);
        setLastUnlocked(item);
        break;
      }
    }
  };

  const totalRounds = world.totalRounds ?? memory.gameHistory.length;
  const unlocked = WORLD_ITEMS.filter((i) => totalRounds >= i.threshold);
  const nextItem = WORLD_ITEMS.find((i) => totalRounds < i.threshold);
  const progressToNext = nextItem ? Math.round((totalRounds / nextItem.threshold) * 100) : 100;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card border border-border rounded-2xl p-4 text-center">
        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Build Our World 🌍</p>
        <p className="text-xs text-muted-foreground">Every game you play together unlocks a new piece of your world</p>
      </div>

      {/* Progress */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-foreground">{totalRounds} rounds played</span>
          {nextItem && <span className="text-xs text-muted-foreground">Next: {nextItem.label} at {nextItem.threshold}</span>}
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="h-2 bg-primary rounded-full transition-all"
            style={{ width: `${Math.min(progressToNext, 100)}%` }}
          />
        </div>
        {nextItem && (
          <p className="text-[10px] text-muted-foreground mt-1 text-right">
            {nextItem.threshold - totalRounds} more rounds to unlock {nextItem.emoji}
          </p>
        )}
      </div>

      {pandaComment && lastUnlocked && (
        <div className="bg-primary/10 border-2 border-primary rounded-2xl p-4 text-center">
          <p className="text-3xl mb-1">{lastUnlocked.emoji}</p>
          <p className="text-sm font-bold text-primary">New unlock: {lastUnlocked.label}!</p>
          <PandaBubble text={pandaComment} className="mt-2 text-left" />
        </div>
      )}

      {/* Unlocked items */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Your World</p>
        <div className="grid grid-cols-2 gap-2">
          {WORLD_ITEMS.map((item) => {
            const isUnlocked = totalRounds >= item.threshold;
            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-3 transition-all ${
                  isUnlocked
                    ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30"
                    : "bg-muted/30 border-border opacity-50"
                }`}
              >
                <p className={`text-2xl mb-1 ${!isUnlocked ? "grayscale" : ""}`}>{isUnlocked ? item.emoji : "🔒"}</p>
                <p className="text-xs font-semibold text-foreground leading-tight">{item.label}</p>
                {isUnlocked ? (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                ) : (
                  <p className="text-[10px] text-muted-foreground mt-0.5">Unlocks at {item.threshold} rounds</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {unlocked.length === WORLD_ITEMS.length && (
        <div className="bg-primary/10 rounded-2xl p-4 text-center">
          <p className="text-xl mb-1">🌌</p>
          <p className="text-sm font-bold text-primary">World Complete! Your love is legendary 💕</p>
        </div>
      )}
    </div>
  );
}
