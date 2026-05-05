import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PandaBubble, PandaThinking } from "./PandaAvatar";
import { generateQuestion, evaluateAnswer } from "@/lib/panda";
import { subscribeLatestGame, addGameDoc, setGameDoc, getGameDoc, addGameHistory, addPoints } from "@/lib/gameFirestore";
import type { GameComponentProps } from "./GamePanel";

export function GuessMyAnswer({ uid, partnerUid, partnerName, myName, memory, onSendToChat, onComplete }: GameComponentProps) {
  const [phase, setPhase] = useState<"loading" | "role_wait" | "answering" | "wait_answer" | "guessing" | "wait_guess" | "revealed">("loading");
  const [question, setQuestion] = useState("");
  const [myRole, setMyRole] = useState<"answerer" | "guesser" | null>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const [realAnswer, setRealAnswer] = useState("");
  const [guess, setGuess] = useState("");
  const [draftGuess, setDraftGuess] = useState("");
  const [score, setScore] = useState(0);
  const [pandaComment, setPandaComment] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);

  const isPlayer1 = !partnerUid || uid < (partnerUid ?? "z");

  useEffect(() => {
    const unsub = subscribeLatestGame("guessmyanswer", (data) => {
      if (!data) { setupRound(); return; }
      const status = data.status as string;
      setDocId(data.id as string);
      setQuestion(data.question as string);
      const answerer = data.answerer as string;
      const role: "answerer" | "guesser" = answerer === uid ? "answerer" : "guesser";
      setMyRole(role);

      if (status === "set_question") {
        if (role === "answerer") setPhase("answering");
        else setPhase("wait_answer");
      } else if (status === "answer_set") {
        if (role === "guesser") setPhase("guessing");
        else setPhase("wait_guess");
      } else if (status === "revealed") {
        setRealAnswer(data.answer as string ?? "");
        setGuess(data.guess as string ?? "");
        setScore(data.score as number ?? 0);
        setPandaComment(data.pandaComment as string ?? "");
        setIsCorrect(data.correct as boolean ?? false);
        setPhase("revealed");
      }
    });
    return unsub;
  }, [uid]);

  const setupRound = async () => {
    setPhase("loading");
    const res = await generateQuestion("Guess My Answer", memory);
    const answerer = isPlayer1 ? uid : (partnerUid ?? uid);
    const id = await addGameDoc("guessmyanswer", {
      question: res.question,
      answerer,
      answer: null,
      guess: null,
      status: "set_question",
    });
    setDocId(id);
    setQuestion(res.question);
    setMyRole(answerer === uid ? "answerer" : "guesser");
    if (answerer === uid) setPhase("answering");
    else setPhase("wait_answer");
  };

  const submitAnswer = async () => {
    if (!realAnswer.trim() || !docId) return;
    await setGameDoc("guessmyanswer", docId, { answer: realAnswer, status: "answer_set" });
    setPhase("wait_guess");
  };

  const submitGuess = async () => {
    if (!draftGuess.trim() || !docId) return;
    setPhase("loading");
    try {
      let realAns = realAnswer;
      if (!realAns && docId) {
        const d = await getGameDoc("guessmyanswer", docId);
        realAns = (d?.answer as string) ?? "";
      }
      const result = await evaluateAnswer(question, realAns, draftGuess);
      setPandaComment(result.pandaComment);
      setScore(result.score);
      setIsCorrect(result.correct);
      setGuess(draftGuess);
      setRealAnswer(realAns);
      await setGameDoc("guessmyanswer", docId, {
        guess: draftGuess,
        score: result.score,
        correct: result.correct,
        pandaComment: result.pandaComment,
        status: "revealed",
      });
      await addGameHistory("guessmyanswer", `Q: ${question} — answer: ${realAns}, guess: ${draftGuess}, score: ${result.score}`);
      if (result.correct) await addPoints("player2", 15);
      setPhase("revealed");
      onSendToChat({
        gameType: "guessmyanswer",
        gameName: "Guess My Answer",
        emoji: "🔍",
        result: `Score: ${result.score}/100 — answer was "${realAns}"`,
        pandaComment: result.pandaComment,
        matched: result.correct,
        score: result.score,
      });
    } catch {
      setPhase("guessing");
    }
  };

  if (phase === "loading") return <PandaThinking label="Setting up the round…" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card border border-border rounded-2xl p-4 text-center">
        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Guess My Answer 🔍</p>
        <p className="text-base font-semibold text-foreground">{question}</p>
        {myRole && (
          <p className="text-[10px] text-muted-foreground mt-1">
            {myRole === "answerer" ? "You're setting the answer" : `You're guessing ${partnerName}'s answer`}
          </p>
        )}
      </div>

      {phase === "answering" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground text-center">Type your real answer — {partnerName} will try to guess it!</p>
          <Input
            value={realAnswer}
            onChange={(e) => setRealAnswer(e.target.value)}
            placeholder="Your true answer…"
            className="rounded-2xl"
          />
          <Button onClick={submitAnswer} disabled={!realAnswer.trim()} className="rounded-2xl">
            Set my answer 🔒
          </Button>
        </div>
      )}

      {phase === "wait_answer" && (
        <div className="text-center py-6">
          <p className="text-4xl mb-3 animate-bounce">✍️</p>
          <p className="text-sm text-muted-foreground">{partnerName} is writing their answer…</p>
        </div>
      )}

      {phase === "guessing" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground text-center">What do you think {partnerName} answered?</p>
          <Input
            value={draftGuess}
            onChange={(e) => setDraftGuess(e.target.value)}
            placeholder="Your guess…"
            className="rounded-2xl"
          />
          <Button onClick={submitGuess} disabled={!draftGuess.trim()} className="rounded-2xl">
            Submit guess 🎯
          </Button>
        </div>
      )}

      {phase === "wait_guess" && (
        <div className="text-center py-6">
          <p className="text-4xl mb-3 animate-bounce">🤔</p>
          <p className="text-sm text-muted-foreground">{partnerName} is guessing…</p>
        </div>
      )}

      {phase === "revealed" && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-2">
            <div className="rounded-2xl border border-border bg-primary/5 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Real answer</p>
              <p className="text-sm font-bold text-foreground">{realAnswer}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">The guess</p>
              <p className="text-sm font-medium text-foreground">{guess}</p>
            </div>
          </div>
          <div className={`rounded-2xl border-2 p-3 text-center ${isCorrect ? "border-primary bg-primary/10" : "border-border"}`}>
            <p className="text-2xl font-bold text-primary">{score}/100</p>
            <p className="text-xs text-muted-foreground mt-0.5">{isCorrect ? "Got it! +15 pts 🎉" : "Good try!"}</p>
          </div>
          {pandaComment && <PandaBubble text={pandaComment} />}
          <Button onClick={setupRound} className="w-full rounded-2xl">Play Again 🔍</Button>
        </div>
      )}
    </div>
  );
}
