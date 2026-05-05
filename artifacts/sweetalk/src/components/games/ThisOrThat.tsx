import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PandaBubble, PandaThinking, ConfettiBurst } from "./PandaAvatar";
import { generateQuestion, generateReveal } from "@/lib/panda";
import { subscribeLatestGame, addGameDoc, setGameDoc, addGameHistory, addPoints } from "@/lib/gameFirestore";
import type { GameComponentProps } from "./GamePanel";

type Phase = "loading" | "picking" | "waiting" | "revealed";

export function ThisOrThat({ uid, partnerUid, partnerName, myName, memory, onSendToChat, onComplete }: GameComponentProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [myPick, setMyPick] = useState<string | null>(null);
  const [partnerPick, setPartnerPick] = useState<string | null>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const [pandaComment, setPandaComment] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [generating, setGenerating] = useState(false);

  const isPlayer1 = !partnerUid || uid < (partnerUid ?? "z");
  const myField = isPlayer1 ? "pick1" : "pick2";
  const partnerField = isPlayer1 ? "pick2" : "pick1";

  const startNewRound = async () => {
    setPhase("loading");
    setGenerating(true);
    setMyPick(null);
    setPartnerPick(null);
    setPandaComment("");
    setShowConfetti(false);
    try {
      const res = await generateQuestion("This or That", memory);
      setQuestion(res.question);
      setOptions(res.options ?? ["Option A 🌅", "Option B 🌙"]);
      const id = await addGameDoc("thisorthat", {
        question: res.question,
        options: res.options ?? [],
        pick1: null,
        pick2: null,
        status: "picking",
      });
      setDocId(id);
      setPhase("picking");
    } catch {
      setOptions(["Morning cuddle 🌅", "Goodnight message 🌙"]);
      setQuestion("Morning cuddle or goodnight message?");
      setPhase("picking");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    const unsub = subscribeLatestGame("thisorthat", (data) => {
      if (!data) { startNewRound(); return; }
      const status = data.status as string;
      const q = data.question as string;
      const opts = (data.options as string[]) ?? [];
      const p1 = (data.pick1 as string | null);
      const p2 = (data.pick2 as string | null);
      const id = data.id as string;

      setDocId(id);
      setQuestion(q);
      setOptions(opts);

      const mine = isPlayer1 ? p1 : p2;
      const theirs = isPlayer1 ? p2 : p1;
      if (mine) setMyPick(mine);
      if (theirs) setPartnerPick(theirs);

      if (status === "picking" && !mine) setPhase("picking");
      else if (status === "picking" && mine && !theirs) setPhase("waiting");
      else if (status === "revealed") {
        setMyPick(mine);
        setPartnerPick(theirs);
        setPandaComment((data.pandaComment as string) ?? "");
        setPhase("revealed");
        setShowConfetti(mine === theirs);
      }
    });
    return unsub;
  }, [isPlayer1]);

  const handlePick = async (opt: string) => {
    if (!docId || myPick) return;
    setMyPick(opt);
    await setGameDoc("thisorthat", docId, { [myField]: opt });
    setPhase("waiting");
  };

  useEffect(() => {
    if (myPick && partnerPick && docId && phase === "waiting") {
      revealAnswers();
    }
  }, [myPick, partnerPick, phase]);

  const revealAnswers = async () => {
    if (!docId) return;
    const comment = await generateReveal(question, myPick!, partnerPick!, myName, partnerName);
    setPandaComment(comment);
    await setGameDoc("thisorthat", docId, { status: "revealed", pandaComment: comment });
    await addGameHistory("thisorthat", `Q: ${question} — ${myName}: ${myPick}, ${partnerName}: ${partnerPick}`);
    const matched = myPick === partnerPick;
    if (matched) {
      await addPoints(isPlayer1 ? "player1" : "player2", 10);
    }
    setShowConfetti(matched);
    setPhase("revealed");
    onSendToChat({
      gameType: "thisorthat",
      gameName: "This or That",
      emoji: "🎲",
      result: `${myName} chose "${myPick}" · ${partnerName} chose "${partnerPick}"`,
      pandaComment: comment,
      matched,
    });
  };

  if (phase === "loading" || generating) return <PandaThinking label="Panda is choosing a question…" />;

  return (
    <div className="flex flex-col gap-4 relative">
      <ConfettiBurst active={showConfetti} />

      <div className="bg-card border border-border rounded-2xl p-4 text-center">
        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">This or That 🎲</p>
        <p className="text-base font-semibold text-foreground leading-snug">{question}</p>
      </div>

      {phase === "picking" && (
        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => handlePick(opt)}
              className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-border hover:border-primary rounded-2xl p-4 text-center font-semibold text-sm transition-all hover:scale-105 active:scale-95"
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {phase === "waiting" && (
        <div className="text-center py-6">
          <p className="text-4xl mb-3 animate-bounce">⏳</p>
          <p className="text-sm font-medium text-foreground">You picked <span className="text-primary font-bold">{myPick}</span></p>
          <p className="text-xs text-muted-foreground mt-1">Waiting for {partnerName} to pick…</p>
        </div>
      )}

      {phase === "revealed" && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-2xl border-2 p-3 text-center ${myPick === partnerPick ? "border-primary bg-primary/10" : "border-border"}`}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">You</p>
              <p className="text-sm font-bold text-foreground">{myPick}</p>
            </div>
            <div className={`rounded-2xl border-2 p-3 text-center ${myPick === partnerPick ? "border-primary bg-primary/10" : "border-border"}`}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{partnerName}</p>
              <p className="text-sm font-bold text-foreground">{partnerPick ?? "…"}</p>
            </div>
          </div>

          {myPick === partnerPick && (
            <div className="bg-primary/10 rounded-2xl p-3 text-center">
              <p className="text-lg font-bold text-primary">Perfect match! 🎉</p>
              <p className="text-xs text-muted-foreground mt-0.5">+10 points each!</p>
            </div>
          )}

          {pandaComment && <PandaBubble text={pandaComment} />}

          <Button onClick={startNewRound} className="w-full rounded-2xl">
            Next Question 🎲
          </Button>
        </div>
      )}
    </div>
  );
}
