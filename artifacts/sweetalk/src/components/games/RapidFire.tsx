import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PandaBubble, PandaThinking } from "./PandaAvatar";
import { askPanda, generateQuestion } from "@/lib/panda";
import { addGameHistory, addPoints } from "@/lib/gameFirestore";
import type { GameComponentProps } from "./GamePanel";

const TIME_LIMIT = 30;

const RAPID_PROMPTS = [
  "Dog or cat?", "Beach or mountains?", "Morning or night?", "Coffee or tea?",
  "Netflix or cinema?", "Summer or winter?", "Cook or order in?", "Call or text?",
  "Early bird or night owl?", "City or countryside?", "Books or movies?",
  "Sweet or salty?", "Plan ahead or spontaneous?", "Introvert or extrovert?",
  "Dance or sing?", "Rain or sunshine?", "Past or future?", "Head or heart?",
];

export function RapidFire({ uid, partnerUid, partnerName, myName, memory, onSendToChat, onComplete }: GameComponentProps) {
  const [phase, setPhase] = useState<"menu" | "playing" | "done">("menu");
  const [prompts, setPrompts] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [pandaComment, setPandaComment] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startGame = async () => {
    const shuffled = [...RAPID_PROMPTS].sort(() => Math.random() - 0.5).slice(0, 12);
    setPrompts(shuffled);
    setCurrentIdx(0);
    setAnswers([]);
    setTimeLeft(TIME_LIMIT);
    setPandaComment("");
    setPhase("playing");
  };

  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          finishGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase]);

  const answer = (choice: string) => {
    setAnswers((prev) => [...prev, choice]);
    if (currentIdx + 1 >= prompts.length) {
      clearInterval(timerRef.current!);
      finishGame(currentIdx + 1);
    } else {
      setCurrentIdx((i) => i + 1);
    }
  };

  const finishGame = async (count?: number) => {
    const finalCount = count ?? answers.length;
    clearInterval(timerRef.current!);
    const comment = await askPanda(
      `${myName} just finished a 30-second rapid fire round, answering ${finalCount} questions. Give a playful, energetic 1-sentence reaction. Max 15 words.`,
      memory
    );
    setPandaComment(comment);
    await addPoints("player1", finalCount * 2);
    await addGameHistory("rapidfire", `Answered ${finalCount} questions`);
    setPhase("done");
    onSendToChat({
      gameType: "rapidfire",
      gameName: "Rapid Fire",
      emoji: "⚡",
      result: `Answered ${finalCount} questions in ${TIME_LIMIT - timeLeft}s!`,
      pandaComment: comment,
    });
  };

  const timerColor = timeLeft > 15 ? "text-primary" : timeLeft > 5 ? "text-orange-500" : "text-destructive";

  if (phase === "menu") {
    return (
      <div className="flex flex-col gap-4 items-center text-center">
        <p className="text-4xl">⚡</p>
        <div>
          <p className="font-bold text-foreground">Rapid Fire</p>
          <p className="text-xs text-muted-foreground mt-1">Answer as many questions as you can in 30 seconds — no thinking allowed!</p>
        </div>
        <div className="bg-primary/10 rounded-2xl p-3 w-full">
          <p className="text-xs text-muted-foreground">⚡ Quick picks, no second-guessing</p>
          <p className="text-xs text-muted-foreground">📊 {RAPID_PROMPTS.length} possible questions</p>
          <p className="text-xs text-muted-foreground">🎯 +2 pts per answer</p>
        </div>
        <Button onClick={startGame} className="rounded-2xl w-full">Start! ⚡</Button>
      </div>
    );
  }

  if (phase === "playing" && prompts[currentIdx]) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{answers.length}/{prompts.length} answered</span>
          <span className={`text-2xl font-bold tabular-nums ${timerColor}`}>{timeLeft}s</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${timeLeft > 15 ? "bg-primary" : timeLeft > 5 ? "bg-orange-500" : "bg-destructive"}`}
            style={{ width: `${(timeLeft / TIME_LIMIT) * 100}%` }}
          />
        </div>
        <div className="bg-card border-2 border-primary/30 rounded-2xl p-6 text-center min-h-[100px] flex items-center justify-center">
          <p className="text-base font-bold text-foreground">{prompts[currentIdx]}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {prompts[currentIdx].includes(" or ") ? (
            prompts[currentIdx].split(" or ").map((opt) => (
              <button
                key={opt}
                onClick={() => answer(opt.replace("?", "").trim())}
                className="bg-primary/10 border-2 border-primary/30 hover:border-primary rounded-2xl p-4 text-sm font-bold text-foreground hover:scale-105 active:scale-95 transition-all"
              >
                {opt.replace("?", "").trim()}
              </button>
            ))
          ) : (
            <>
              <button onClick={() => answer("Yes!")} className="bg-primary/10 border-2 border-primary/30 hover:border-primary rounded-2xl p-4 text-sm font-bold text-foreground hover:scale-105 active:scale-95 transition-all">Yes! ✅</button>
              <button onClick={() => answer("No!")} className="bg-muted border-2 border-border hover:border-primary rounded-2xl p-4 text-sm font-bold text-foreground hover:scale-105 active:scale-95 transition-all">No! ❌</button>
            </>
          )}
        </div>
        <button onClick={() => answer("Skip")} className="text-xs text-muted-foreground text-center hover:text-primary">Skip →</button>
      </div>
    );
  }

  const finalCount = answers.filter((a) => a !== "Skip").length;
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center bg-card border border-border rounded-2xl p-6">
        <p className="text-4xl mb-2">⚡</p>
        <p className="text-2xl font-bold text-primary">{finalCount} answered!</p>
        <p className="text-sm text-muted-foreground mt-1">+{finalCount * 2} points earned</p>
      </div>
      {pandaComment && <PandaBubble text={pandaComment} />}
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
        {prompts.slice(0, answers.length).map((p, i) => (
          <div key={i} className="flex items-center justify-between bg-muted/50 rounded-xl px-3 py-1.5">
            <span className="text-xs text-muted-foreground truncate mr-2">{p}</span>
            <span className="text-xs font-bold text-foreground flex-shrink-0">{answers[i]}</span>
          </div>
        ))}
      </div>
      <Button onClick={startGame} className="w-full rounded-2xl">Go Again ⚡</Button>
    </div>
  );
}
