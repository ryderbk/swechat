import { useState } from "react";
import { Trophy, Flame, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GameComponentProps } from "./GamePanel";

const GAME_LABELS: Record<string, string> = {
  thisorthat: "This or That 🎲",
  answerreveal: "Answer & Reveal 💬",
  guessmyanswer: "Guess My Answer 🔍",
  secretunlock: "Secret Unlock 🔓",
  dailyquestion: "Daily Question 📅",
  memoryquiz: "Memory Quiz 🧠",
  truthordare: "Truth or Dare 🎭",
  completesentence: "Complete the Sentence ✍️",
  rapidfire: "Rapid Fire ⚡",
  randomquestion: "Random Question ❓",
  moodsync: "Mood Sync 😊",
};

export function Scoreboard({ uid, partnerUid, partnerName, myName, memory, onSendToChat, onComplete }: GameComponentProps) {
  const [tab, setTab] = useState<"points" | "history">("points");
  const p1 = memory.totalPoints?.player1 ?? 0;
  const p2 = memory.totalPoints?.player2 ?? 0;
  const total = p1 + p2;
  const isPlayer1 = !partnerUid || uid < (partnerUid ?? "z");
  const myPoints = isPlayer1 ? p1 : p2;
  const partnerPoints = isPlayer1 ? p2 : p1;

  const gameCounts: Record<string, number> = {};
  memory.gameHistory.forEach((h) => {
    gameCounts[h.game] = (gameCounts[h.game] ?? 0) + 1;
  });

  const mostPlayed = Object.entries(gameCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const recentHistory = memory.gameHistory.slice(0, 15);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <p className="text-3xl mb-1">📊</p>
        <p className="font-bold text-foreground">Scoreboard</p>
        <p className="text-xs text-muted-foreground mt-0.5">{total} total points earned together</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-2xl border-2 p-4 text-center ${myPoints >= partnerPoints ? "border-primary bg-primary/10" : "border-border"}`}>
          {myPoints > partnerPoints && <Trophy className="w-4 h-4 text-primary mx-auto mb-1" />}
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">You</p>
          <p className="text-3xl font-bold text-primary">{myPoints}</p>
          <p className="text-[10px] text-muted-foreground">points</p>
        </div>
        <div className={`rounded-2xl border-2 p-4 text-center ${partnerPoints > myPoints ? "border-primary bg-primary/10" : "border-border"}`}>
          {partnerPoints > myPoints && <Trophy className="w-4 h-4 text-primary mx-auto mb-1" />}
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{partnerName.split(" ")[0]}</p>
          <p className="text-3xl font-bold text-primary">{partnerPoints}</p>
          <p className="text-[10px] text-muted-foreground">points</p>
        </div>
      </div>

      {myPoints === partnerPoints && total > 0 && (
        <div className="bg-primary/10 rounded-2xl p-3 text-center">
          <p className="text-sm font-bold text-primary">Perfect tie! 💕</p>
          <p className="text-xs text-muted-foreground">You're always equal in love</p>
        </div>
      )}

      <div className="flex gap-1 bg-muted/50 p-1 rounded-2xl">
        <button
          onClick={() => setTab("points")}
          className={`flex-1 text-xs font-medium py-1.5 rounded-xl transition-all ${tab === "points" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          Stats
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 text-xs font-medium py-1.5 rounded-xl transition-all ${tab === "history" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          History ({memory.gameHistory.length})
        </button>
      </div>

      {tab === "points" && (
        <div className="flex flex-col gap-3">
          <div className="bg-card border border-border rounded-2xl p-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Games played</p>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-foreground">{memory.gameHistory.length} rounds total</span>
            </div>
          </div>
          {mostPlayed.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Favourite games</p>
              {mostPlayed.map(([game, count]) => (
                <div key={game} className="flex items-center justify-between py-1">
                  <span className="text-xs text-foreground">{GAME_LABELS[game] ?? game}</span>
                  <span className="text-xs font-bold text-primary">{count}x</span>
                </div>
              ))}
            </div>
          )}
          {Object.entries(memory.streaks ?? {}).length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Streaks</p>
              {Object.entries(memory.streaks).map(([game, streak]) => (
                <div key={game} className="flex items-center justify-between py-1">
                  <span className="text-xs text-foreground">{GAME_LABELS[game] ?? game}</span>
                  <span className="text-xs font-bold text-orange-500">🔥 {streak}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
          {recentHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No games played yet. Start playing! 🎮</p>
          ) : recentHistory.map((h, i) => (
            <div key={i} className="bg-card border border-border rounded-xl px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">{GAME_LABELS[h.game] ?? h.game}</span>
                <span className="text-[10px] text-muted-foreground">{new Date(h.date).toLocaleDateString()}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{h.result}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
