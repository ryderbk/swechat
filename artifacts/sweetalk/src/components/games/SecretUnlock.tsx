import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PandaBubble, PandaThinking } from "./PandaAvatar";
import { evaluateAnswer } from "@/lib/panda";
import { subscribeLatestGame, addGameDoc, setGameDoc, addGameHistory, addPoints } from "@/lib/gameFirestore";
import type { GameComponentProps } from "./GamePanel";

export function SecretUnlock({ uid, partnerUid, partnerName, myName, memory, onSendToChat, onComplete }: GameComponentProps) {
  const [phase, setPhase] = useState<"loading" | "create" | "wait_create" | "guessing" | "wait_guess" | "revealed">("loading");
  const [docId, setDocId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [secretAnswer, setSecretAnswer] = useState("");
  const [hint, setHint] = useState("");
  const [guess, setGuess] = useState("");
  const [guessInput, setGuessInput] = useState("");
  const [score, setScore] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [pandaComment, setPandaComment] = useState("");
  const [draftQ, setDraftQ] = useState("");
  const [draftA, setDraftA] = useState("");
  const [draftH, setDraftH] = useState("");
  const [isCreator, setIsCreator] = useState(false);

  const isPlayer1 = !partnerUid || uid < (partnerUid ?? "z");

  useEffect(() => {
    const unsub = subscribeLatestGame("secretunlock", (data) => {
      if (!data) { setPhase(isPlayer1 ? "create" : "wait_create"); return; }
      const creator = data.creator as string;
      const status = data.status as string;
      const amCreator = creator === uid;
      setIsCreator(amCreator);
      setDocId(data.id as string);
      setQuestion(data.question as string ?? "");
      setHint(data.hint as string ?? "");

      if (status === "created") {
        if (!amCreator) setPhase("guessing");
        else setPhase("wait_guess");
      } else if (status === "revealed") {
        setSecretAnswer(data.answer as string ?? "");
        setGuess(data.guess as string ?? "");
        setScore(data.score as number ?? 0);
        setIsCorrect(data.correct as boolean ?? false);
        setPandaComment(data.pandaComment as string ?? "");
        setPhase("revealed");
      }
    });
    return unsub;
  }, [uid, isPlayer1]);

  const submitSecret = async () => {
    if (!draftQ.trim() || !draftA.trim()) return;
    const id = await addGameDoc("secretunlock", {
      creator: uid,
      question: draftQ,
      answer: draftA,
      hint: draftH,
      guess: null,
      status: "created",
    });
    setDocId(id);
    setQuestion(draftQ);
    setSecretAnswer(draftA);
    setHint(draftH);
    setPhase("wait_guess");
  };

  const submitGuess = async () => {
    if (!guessInput.trim() || !docId) return;
    setPhase("loading");
    try {
      const result = await evaluateAnswer(question, secretAnswer, guessInput);
      await setGameDoc("secretunlock", docId, {
        guess: guessInput,
        score: result.score,
        correct: result.correct,
        pandaComment: result.pandaComment,
        status: "revealed",
      });
      await addGameHistory("secretunlock", `Q: ${question} — score ${result.score}`);
      if (result.correct) await addPoints(isPlayer1 ? "player2" : "player1", 20);
      setGuess(guessInput);
      setScore(result.score);
      setIsCorrect(result.correct);
      setPandaComment(result.pandaComment);
      onSendToChat({
        gameType: "secretunlock",
        gameName: "Secret Unlock",
        emoji: "🔓",
        result: `Secret unlocked ${result.correct ? "✅" : "❌"} — score ${result.score}/100`,
        pandaComment: result.pandaComment,
        matched: result.correct,
        score: result.score,
      });
    } catch { setPhase("guessing"); }
  };

  if (phase === "loading") return <PandaThinking label="Unlocking secrets…" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card border border-border rounded-2xl p-4 text-center">
        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Secret Unlock 🔓</p>
        <p className="text-xs text-muted-foreground">One of you creates a question with a hidden answer. The other tries to guess it!</p>
      </div>

      {phase === "create" && (
        <div className="flex flex-col gap-3">
          <Input value={draftQ} onChange={(e) => setDraftQ(e.target.value)} placeholder="Your question for them…" className="rounded-2xl" />
          <Input value={draftA} onChange={(e) => setDraftA(e.target.value)} placeholder="The secret answer (hidden)…" className="rounded-2xl" type="password" />
          <Input value={draftH} onChange={(e) => setDraftH(e.target.value)} placeholder="A little hint (optional)…" className="rounded-2xl" />
          <Button onClick={submitSecret} disabled={!draftQ.trim() || !draftA.trim()} className="rounded-2xl">
            Hide my secret 🔒
          </Button>
        </div>
      )}

      {phase === "wait_create" && (
        <div className="text-center py-8">
          <p className="text-4xl mb-3 animate-bounce">✍️</p>
          <p className="text-sm text-muted-foreground">{partnerName} is writing a secret question for you…</p>
        </div>
      )}

      {phase === "guessing" && (
        <div className="flex flex-col gap-3">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Question from {partnerName}</p>
            <p className="text-base font-semibold text-foreground">{question}</p>
            {hint && <p className="text-xs text-primary mt-2">💡 Hint: {hint}</p>}
          </div>
          <Input value={guessInput} onChange={(e) => setGuessInput(e.target.value)} placeholder="Your guess…" className="rounded-2xl" />
          <Button onClick={submitGuess} disabled={!guessInput.trim()} className="rounded-2xl">Submit guess 🎯</Button>
        </div>
      )}

      {phase === "wait_guess" && (
        <div className="text-center py-8">
          <p className="text-4xl mb-3 animate-bounce">🤔</p>
          <p className="text-sm text-muted-foreground">{partnerName} is guessing your secret…</p>
        </div>
      )}

      {phase === "revealed" && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-2">
            <div className="rounded-2xl border border-border bg-primary/5 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Secret answer</p>
              <p className="text-sm font-bold text-foreground">{secretAnswer}</p>
            </div>
            <div className="rounded-2xl border border-border p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">The guess</p>
              <p className="text-sm text-foreground">{guess}</p>
            </div>
          </div>
          <div className={`rounded-2xl border-2 p-3 text-center ${isCorrect ? "border-primary bg-primary/10" : "border-border"}`}>
            <p className="text-2xl font-bold text-primary">{score}/100</p>
            <p className="text-xs text-muted-foreground mt-0.5">{isCorrect ? "Secret unlocked! +20 pts 🎉" : "Almost!"}</p>
          </div>
          {pandaComment && <PandaBubble text={pandaComment} />}
          <Button onClick={() => setPhase(isPlayer1 ? "create" : "wait_create")} className="w-full rounded-2xl">New Secret 🔓</Button>
        </div>
      )}
    </div>
  );
}
