import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PandaBubble, PandaThinking } from "./PandaAvatar";
import { generateQuestion, generateReveal } from "@/lib/panda";
import { subscribeDailyDoc, setDailyDoc, todayKey, addGameHistory } from "@/lib/gameFirestore";
import type { GameComponentProps } from "./GamePanel";

export function OneQuestionADay({ uid, partnerUid, partnerName, myName, memory, onSendToChat, onComplete }: GameComponentProps) {
  const [phase, setPhase] = useState<"loading" | "answering" | "waiting" | "revealed">("loading");
  const [question, setQuestion] = useState("");
  const [myAnswer, setMyAnswer] = useState("");
  const [draftAnswer, setDraftAnswer] = useState("");
  const [partnerAnswer, setPartnerAnswer] = useState<string | null>(null);
  const [pandaComment, setPandaComment] = useState("");
  const [dateKey] = useState(todayKey());
  const [streak, setStreak] = useState(0);

  const isPlayer1 = !partnerUid || uid < (partnerUid ?? "z");
  const myField = isPlayer1 ? "answer1" : "answer2";
  const partnerField = isPlayer1 ? "answer2" : "answer1";

  useEffect(() => {
    const unsub = subscribeDailyDoc(dateKey, async (data) => {
      if (!data) {
        setPhase("loading");
        if (isPlayer1) {
          try {
            const res = await generateQuestion("One Question a Day", memory);
            await setDailyDoc(dateKey, { question: res.question, answer1: null, answer2: null, status: "open" });
            setQuestion(res.question);
          } catch { setQuestion("What's one thing you're grateful for about us today?"); }
        }
        setPhase("answering");
        return;
      }

      const q = data.question as string;
      const status = data.status as string;
      const mine = isPlayer1 ? data.answer1 : data.answer2;
      const theirs = isPlayer1 ? data.answer2 : data.answer1;
      const streak = data.streak as number ?? 0;

      setQuestion(q);
      setStreak(streak);
      if (mine) setMyAnswer(mine as string);
      if (theirs) setPartnerAnswer(theirs as string);

      if (status === "open") {
        if (!mine) setPhase("answering");
        else setPhase("waiting");
      } else if (status === "revealed") {
        setPandaComment(data.pandaComment as string ?? "");
        setPhase("revealed");
      }
    });
    return unsub;
  }, [dateKey, isPlayer1]);

  const submitAnswer = async () => {
    if (!draftAnswer.trim()) return;
    const ans = draftAnswer.trim();
    setMyAnswer(ans);
    await setDailyDoc(dateKey, { [myField]: ans });
    setPhase("waiting");
  };

  useEffect(() => {
    if (myAnswer && partnerAnswer && phase === "waiting") {
      doReveal();
    }
  }, [myAnswer, partnerAnswer, phase]);

  const doReveal = async () => {
    const comment = await generateReveal(question, myAnswer, partnerAnswer!, myName, partnerName);
    setPandaComment(comment);
    await setDailyDoc(dateKey, { status: "revealed", pandaComment: comment, streak: streak + 1 });
    await addGameHistory("dailyquestion", `${dateKey}: ${question}`);
    setPhase("revealed");
    onSendToChat({
      gameType: "dailyquestion",
      gameName: "Daily Question",
      emoji: "📅",
      result: `${myName}: "${myAnswer}" · ${partnerName}: "${partnerAnswer}"`,
      pandaComment: comment,
    });
  };

  if (phase === "loading") return <PandaThinking label="Panda is preparing today's question…" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card border border-border rounded-2xl p-4 text-center">
        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Daily Question 📅</p>
        <p className="text-[10px] text-muted-foreground mb-3">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        <p className="text-base font-semibold text-foreground leading-snug">{question}</p>
        {streak > 0 && (
          <div className="flex items-center justify-center gap-1 mt-2">
            <span className="text-xs font-bold text-orange-500">🔥 {streak} day streak!</span>
          </div>
        )}
      </div>

      {phase === "answering" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground text-center">One question per day, both answer, then reveal together 💕</p>
          <Input
            value={draftAnswer}
            onChange={(e) => setDraftAnswer(e.target.value)}
            placeholder="Your answer for today…"
            className="rounded-2xl"
            onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
          />
          <Button onClick={submitAnswer} disabled={!draftAnswer.trim()} className="rounded-2xl">
            Lock in 🔒
          </Button>
        </div>
      )}

      {phase === "waiting" && (
        <div className="text-center py-6">
          <p className="text-4xl mb-3 animate-bounce">⏳</p>
          <p className="text-sm font-medium text-foreground">Your answer is saved!</p>
          <p className="text-xs text-muted-foreground mt-1">Waiting for {partnerName} to answer today's question…</p>
        </div>
      )}

      {phase === "revealed" && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-2">
            <div className="rounded-2xl border border-border bg-primary/5 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Your answer</p>
              <p className="text-sm font-medium text-foreground">{myAnswer}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{partnerName}'s answer</p>
              <p className="text-sm font-medium text-foreground">{partnerAnswer}</p>
            </div>
          </div>
          {streak > 0 && (
            <div className="bg-orange-500/10 rounded-2xl p-3 text-center">
              <p className="text-sm font-bold text-orange-500">🔥 {streak} day streak!</p>
              <p className="text-xs text-muted-foreground mt-0.5">Come back tomorrow for a new question</p>
            </div>
          )}
          {pandaComment && <PandaBubble text={pandaComment} />}
          <div className="bg-muted/50 rounded-2xl p-3 text-center">
            <p className="text-xs text-muted-foreground">Come back tomorrow for a new question 💕</p>
          </div>
        </div>
      )}
    </div>
  );
}
