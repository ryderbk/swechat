import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PandaBubble, PandaThinking } from "./PandaAvatar";
import { generateQuestion, generateReveal } from "@/lib/panda";
import { subscribeLatestGame, addGameDoc, setGameDoc, getGameDoc, addGameHistory, addPoints } from "@/lib/gameFirestore";
import type { GameComponentProps } from "./GamePanel";

type Phase = "loading" | "waiting_for_round" | "answering" | "waiting" | "revealed";

function WaitingForRound({ partnerName }: { partnerName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
      </div>
      <p className="text-sm font-medium text-foreground text-center">
        Waiting for {partnerName} to start a round…
      </p>
      <p className="text-xs text-muted-foreground">Both of you need to have the game open 💕</p>
    </div>
  );
}

export function AnswerReveal({ uid, partnerUid, partnerName, myName, memory, onSendToChat, onComplete }: GameComponentProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [question, setQuestion] = useState("");
  const [docId, setDocId] = useState<string | null>(null);
  const [myDraft, setMyDraft] = useState("");
  const [myAnswer, setMyAnswer] = useState("");
  const [partnerAnswer, setPartnerAnswer] = useState("");
  const [pandaComment, setPandaComment] = useState("");
  const [revealed, setRevealed] = useState(false);

  const isPlayer1 = !partnerUid || uid < (partnerUid ?? "z");
  const myAnswerField = isPlayer1 ? "answer1" : "answer2";
  const myLockedField = isPlayer1 ? "answer1Locked" : "answer2Locked";
  const partnerAnswerField = isPlayer1 ? "answer2" : "answer1";
  const partnerLockedField = isPlayer1 ? "answer2Locked" : "answer1Locked";

  const startRound = async () => {
    setPhase("loading");
    setMyDraft("");
    setMyAnswer("");
    setPartnerAnswer("");
    setPandaComment("");
    setRevealed(false);
    try {
      const res = await generateQuestion("Answer & Reveal", memory);
      const id = await addGameDoc("answerreveal", {
        question: res.question,
        answer1: null,
        answer2: null,
        answer1Locked: false,
        answer2Locked: false,
        status: "answering",
        pandaComment: "",
      });
      setDocId(id);
    } catch {
      const id = await addGameDoc("answerreveal", {
        question: "What is one memory of us that always makes you smile?",
        answer1: null,
        answer2: null,
        answer1Locked: false,
        answer2Locked: false,
        status: "answering",
        pandaComment: "",
      });
      setDocId(id);
    }
  };

  useEffect(() => {
    const unsub = subscribeLatestGame("answerreveal", (data) => {
      if (!data) {
        if (isPlayer1) {
          startRound();
        } else {
          setPhase("waiting_for_round");
        }
        return;
      }

      const status = data.status as string;
      setDocId(data.id as string);
      setQuestion(data.question as string ?? "");

      const mine = data[myAnswerField] as string | null;
      const theirs = data[partnerAnswerField] as string | null;
      const myLocked = data[myLockedField] as boolean;
      const theirLocked = data[partnerLockedField] as boolean;

      if (mine) setMyAnswer(mine);

      if (status === "revealed") {
        if (mine) setMyAnswer(mine);
        if (theirs) setPartnerAnswer(theirs);
        setPandaComment(data.pandaComment as string ?? "");
        setRevealed(true);
        setPhase("revealed");
      } else if (myLocked) {
        setPhase("waiting");
      } else {
        setPhase("answering");
      }
    });
    return unsub;
  }, [isPlayer1]);

  const lockAnswer = async () => {
    if (!myDraft.trim() || !docId) return;
    const ans = myDraft.trim();
    setMyAnswer(ans);
    await setGameDoc("answerreveal", docId, {
      [myAnswerField]: ans,
      [myLockedField]: true,
    });
    setPhase("waiting");
  };

  useEffect(() => {
    if (!docId || phase !== "waiting" || !isPlayer1) return;

    const checkReveal = async () => {
      const data = await getGameDoc("answerreveal", docId);
      if (!data) return;
      const a1 = data.answer1Locked as boolean;
      const a2 = data.answer2Locked as boolean;
      if (a1 && a2) {
        const pAnswer = (isPlayer1 ? data.answer2 : data.answer1) as string;
        const myAns = (isPlayer1 ? data.answer1 : data.answer2) as string;
        const comment = await generateReveal(question, myAns, pAnswer, myName, partnerName);
        await setGameDoc("answerreveal", docId, {
          status: "revealed",
          pandaComment: comment,
        });
        await addGameHistory("answerreveal", `Q: "${question}" — ${myName}: "${myAns}", ${partnerName}: "${pAnswer}"`);
        await addPoints("player1", 5);
        await addPoints("player2", 5);
        onSendToChat({
          gameType: "answerreveal",
          gameName: "Answer & Reveal",
          emoji: "💬",
          result: `${myName}: "${myAns}" · ${partnerName}: "${pAnswer}"`,
          pandaComment: comment,
        });
      }
    };

    checkReveal().catch(console.error);
  }, [phase, docId, isPlayer1]);

  if (phase === "loading") return <PandaThinking label="Panda is thinking of a question…" />;
  if (phase === "waiting_for_round") return <WaitingForRound partnerName={partnerName} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card border border-border rounded-2xl p-4 text-center">
        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Answer & Reveal 💬</p>
        <p className="text-base font-semibold text-foreground leading-snug">{question}</p>
      </div>

      {phase === "answering" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground text-center">
            Write your answer privately — both are hidden until you both lock in 🔒
          </p>
          <Input
            value={myDraft}
            onChange={(e) => setMyDraft(e.target.value)}
            placeholder="Your answer…"
            className="rounded-2xl"
            onKeyDown={(e) => e.key === "Enter" && lockAnswer()}
          />
          <Button onClick={lockAnswer} disabled={!myDraft.trim()} className="rounded-2xl">
            Lock in Answer 🔒
          </Button>
          <div className="rounded-2xl border border-dashed border-border p-3 text-center opacity-50">
            <p className="text-xs text-muted-foreground">••••••</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{partnerName}'s answer (hidden)</p>
          </div>
        </div>
      )}

      {phase === "waiting" && (
        <div className="text-center py-6">
          <p className="text-4xl mb-3 animate-bounce">🔒</p>
          <p className="text-sm font-medium text-foreground">Your answer is locked in!</p>
          <p className="text-xs text-muted-foreground mt-1">Waiting for {partnerName} to lock theirs…</p>
          <div className="mt-4 rounded-2xl border border-dashed border-border p-3 text-center opacity-50">
            <p className="text-xs text-muted-foreground">••••••</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{partnerName}'s answer (hidden)</p>
          </div>
        </div>
      )}

      {phase === "revealed" && (
        <div className="flex flex-col gap-3">
          <div className={`grid grid-cols-1 gap-3 ${revealed ? "animate-in zoom-in-95 duration-500" : ""}`}>
            <div className={`rounded-2xl border-2 p-4 ${revealed ? "border-primary bg-primary/5" : "border-border"}`}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Your answer</p>
              <p className="text-sm font-medium text-foreground">{myAnswer}</p>
            </div>
            <div className={`rounded-2xl border-2 p-4 ${revealed ? "border-primary bg-primary/5" : "border-border"}`}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{partnerName}'s answer</p>
              <p className="text-sm font-medium text-foreground">{partnerAnswer}</p>
            </div>
          </div>

          {pandaComment && <PandaBubble text={pandaComment} />}

          {isPlayer1 ? (
            <Button onClick={startRound} className="w-full rounded-2xl">New Question 💬</Button>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground">Waiting for {partnerName} to start next round…</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
