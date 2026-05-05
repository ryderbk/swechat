import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PandaBubble, PandaThinking } from "./PandaAvatar";
import { generateQuestion, generateReveal } from "@/lib/panda";
import { subscribeLatestGame, addGameDoc, setGameDoc, addGameHistory } from "@/lib/gameFirestore";
import type { GameComponentProps } from "./GamePanel";

const CATEGORIES = ["💕 Love", "😄 Fun", "🌟 Dreams", "🏠 Everyday", "🌍 Adventure"];

export function AnswerReveal({ uid, partnerUid, partnerName, myName, memory, onSendToChat, onComplete }: GameComponentProps) {
  const [phase, setPhase] = useState<"loading" | "category" | "answering" | "waiting" | "revealed">("loading");
  const [question, setQuestion] = useState("");
  const [myAnswer, setMyAnswer] = useState("");
  const [draftAnswer, setDraftAnswer] = useState("");
  const [partnerAnswer, setPartnerAnswer] = useState<string | null>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const [pandaComment, setPandaComment] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const isPlayer1 = !partnerUid || uid < (partnerUid ?? "z");
  const myField = isPlayer1 ? "answer1" : "answer2";
  const partnerField = isPlayer1 ? "answer2" : "answer1";

  const startRound = async (category: string) => {
    setSelectedCategory(category);
    setPhase("loading");
    try {
      const res = await generateQuestion("Answer & Reveal", memory, category);
      setQuestion(res.question);
      const id = await addGameDoc("answerreveal", {
        question: res.question,
        category,
        answer1: null,
        answer2: null,
        status: "answering",
      });
      setDocId(id);
      setPhase("answering");
    } catch {
      setQuestion("What is the most romantic thing your partner has ever done for you?");
      setPhase("answering");
    }
  };

  useEffect(() => {
    const unsub = subscribeLatestGame("answerreveal", (data) => {
      if (!data) { setPhase("category"); return; }
      const status = data.status as string;
      setQuestion(data.question as string);
      setDocId(data.id as string);
      const mine = isPlayer1 ? data.answer1 : data.answer2;
      const theirs = isPlayer1 ? data.answer2 : data.answer1;
      if (mine) setMyAnswer(mine as string);
      if (theirs) setPartnerAnswer(theirs as string);
      if (status === "answering") {
        if (!mine) setPhase("answering");
        else setPhase("waiting");
      } else if (status === "revealed") {
        setPandaComment((data.pandaComment as string) ?? "");
        setPhase("revealed");
      }
    });
    return unsub;
  }, [isPlayer1]);

  const submitAnswer = async () => {
    if (!draftAnswer.trim() || !docId) return;
    const ans = draftAnswer.trim();
    setMyAnswer(ans);
    await setGameDoc("answerreveal", docId, { [myField]: ans });
    setPhase("waiting");
  };

  useEffect(() => {
    if (myAnswer && partnerAnswer && docId && phase === "waiting") {
      doReveal();
    }
  }, [myAnswer, partnerAnswer, phase]);

  const doReveal = async () => {
    if (!docId) return;
    const comment = await generateReveal(question, myAnswer, partnerAnswer!, myName, partnerName);
    setPandaComment(comment);
    await setGameDoc("answerreveal", docId, { status: "revealed", pandaComment: comment });
    await addGameHistory("answerreveal", `Q: ${question} — ${myName}: ${myAnswer}, ${partnerName}: ${partnerAnswer}`);
    setPhase("revealed");
    onSendToChat({
      gameType: "answerreveal",
      gameName: "Answer & Reveal",
      emoji: "💬",
      result: `${myName}: "${myAnswer}" · ${partnerName}: "${partnerAnswer}"`,
      pandaComment: comment,
    });
  };

  if (phase === "loading") return <PandaThinking label="Panda is crafting a question…" />;

  if (phase === "category") {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <p className="text-2xl mb-1">💬</p>
          <p className="font-bold text-foreground">Answer & Reveal</p>
          <p className="text-xs text-muted-foreground mt-1">Pick a category, then both answer secretly</p>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => startRound(c)}
              className="bg-gradient-to-r from-primary/10 to-primary/5 border border-border rounded-2xl px-4 py-3 text-sm font-medium text-foreground hover:border-primary transition-all text-left"
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card border border-border rounded-2xl p-4 text-center">
        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Answer & Reveal 💬</p>
        <p className="text-base font-semibold text-foreground">{question}</p>
      </div>

      {phase === "answering" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground text-center">Your answer is hidden until {partnerName} answers too</p>
          <Input
            value={draftAnswer}
            onChange={(e) => setDraftAnswer(e.target.value)}
            placeholder="Type your answer…"
            className="rounded-2xl"
            onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
          />
          <Button onClick={submitAnswer} disabled={!draftAnswer.trim()} className="rounded-2xl">
            Lock in my answer 🔒
          </Button>
        </div>
      )}

      {phase === "waiting" && (
        <div className="text-center py-6">
          <p className="text-4xl mb-3 animate-bounce">⏳</p>
          <p className="text-sm font-medium text-foreground">Your answer is locked in!</p>
          <p className="text-xs text-muted-foreground mt-1">Waiting for {partnerName}…</p>
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
          {pandaComment && <PandaBubble text={pandaComment} />}
          <Button onClick={() => setPhase("category")} className="w-full rounded-2xl">
            New Round 💬
          </Button>
        </div>
      )}
    </div>
  );
}
