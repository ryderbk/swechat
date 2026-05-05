import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PandaBubble, PandaThinking } from "./PandaAvatar";
import { generateMoodSuggestion } from "@/lib/panda";
import { subscribeMoodDoc, setMoodField, hourKey, addGameHistory } from "@/lib/gameFirestore";
import type { GameComponentProps } from "./GamePanel";

const MOODS = [
  { emoji: "😊", label: "Happy", color: "from-yellow-400/20 to-yellow-300/10" },
  { emoji: "🥰", label: "Loved", color: "from-pink-400/20 to-rose-300/10" },
  { emoji: "😴", label: "Sleepy", color: "from-indigo-400/20 to-blue-300/10" },
  { emoji: "😤", label: "Stressed", color: "from-red-400/20 to-orange-300/10" },
  { emoji: "🥺", label: "Emotional", color: "from-purple-400/20 to-violet-300/10" },
  { emoji: "🤩", label: "Excited", color: "from-amber-400/20 to-yellow-300/10" },
  { emoji: "😌", label: "Peaceful", color: "from-green-400/20 to-emerald-300/10" },
  { emoji: "🥳", label: "Celebratory", color: "from-fuchsia-400/20 to-pink-300/10" },
];

export function MoodSync({ uid, partnerUid, partnerName, myName, memory, onSendToChat, onComplete }: GameComponentProps) {
  const [phase, setPhase] = useState<"picking" | "waiting" | "revealed">("picking");
  const [myMood, setMyMood] = useState<string | null>(null);
  const [partnerMood, setPartnerMood] = useState<string | null>(null);
  const [pandaComment, setPandaComment] = useState("");
  const [currentKey] = useState(hourKey());
  const [suggestion, setSuggestion] = useState("");

  const isPlayer1 = !partnerUid || uid < (partnerUid ?? "z");
  const myField = isPlayer1 ? "mood1" : "mood2";
  const partnerField = isPlayer1 ? "mood2" : "mood1";

  useEffect(() => {
    const unsub = subscribeMoodDoc(currentKey, async (data) => {
      if (!data) { setPhase("picking"); return; }
      const mine = data[myField] as string | null;
      const theirs = data[partnerField] as string | null;
      if (mine) setMyMood(mine);
      if (theirs) setPartnerMood(theirs);
      if (mine && theirs && phase !== "revealed") {
        const sugg = await generateMoodSuggestion(mine, theirs);
        setSuggestion(sugg);
        await addGameHistory("moodsync", `${myName}: ${mine}, ${partnerName}: ${theirs}`);
        setPhase("revealed");
        onSendToChat({
          gameType: "moodsync",
          gameName: "Mood Sync",
          emoji: "😊",
          result: `${myName}: ${mine} · ${partnerName}: ${theirs}`,
          pandaComment: sugg,
          matched: mine === theirs,
        });
      } else if (mine) {
        setPhase("waiting");
      }
    });
    return unsub;
  }, [currentKey, isPlayer1]);

  const pickMood = async (mood: string) => {
    setMyMood(mood);
    await setMoodField(currentKey, myField, mood);
    setPhase("waiting");
  };

  const reset = async () => {
    setMyMood(null);
    setPartnerMood(null);
    setPandaComment("");
    setSuggestion("");
    setPhase("picking");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card border border-border rounded-2xl p-4 text-center">
        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Mood Sync 😊</p>
        <p className="text-xs text-muted-foreground">Both pick your current mood — reveal at the same time!</p>
      </div>

      {phase === "picking" && (
        <div className="grid grid-cols-4 gap-2">
          {MOODS.map((m) => (
            <button
              key={m.label}
              onClick={() => pickMood(m.label)}
              className={`bg-gradient-to-br ${m.color} border border-border rounded-2xl py-3 flex flex-col items-center gap-1 hover:scale-105 active:scale-95 transition-all`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[10px] font-medium text-foreground">{m.label}</span>
            </button>
          ))}
        </div>
      )}

      {phase === "waiting" && (
        <div className="text-center py-6">
          <div className="text-5xl mb-3 animate-pulse">
            {MOODS.find((m) => m.label === myMood)?.emoji}
          </div>
          <p className="text-sm font-medium text-foreground">Your mood is locked: <span className="text-primary font-bold">{myMood}</span></p>
          <p className="text-xs text-muted-foreground mt-1">Waiting for {partnerName} to pick their mood…</p>
        </div>
      )}

      {phase === "revealed" && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-2xl border-2 p-4 text-center ${myMood === partnerMood ? "border-primary bg-primary/10" : "border-border"}`}>
              <p className="text-3xl mb-1">{MOODS.find((m) => m.label === myMood)?.emoji}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">You</p>
              <p className="text-sm font-bold text-foreground">{myMood}</p>
            </div>
            <div className={`rounded-2xl border-2 p-4 text-center ${myMood === partnerMood ? "border-primary bg-primary/10" : "border-border"}`}>
              <p className="text-3xl mb-1">{MOODS.find((m) => m.label === partnerMood)?.emoji}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{partnerName.split(" ")[0]}</p>
              <p className="text-sm font-bold text-foreground">{partnerMood}</p>
            </div>
          </div>
          {myMood === partnerMood && (
            <div className="bg-primary/10 rounded-2xl p-3 text-center">
              <p className="text-sm font-bold text-primary">In sync! 🎉 You're feeling the same thing!</p>
            </div>
          )}
          {suggestion && <PandaBubble text={suggestion} />}
          <Button onClick={reset} className="w-full rounded-2xl">Check again 😊</Button>
        </div>
      )}
    </div>
  );
}
