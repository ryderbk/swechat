import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PandaBubble, PandaThinking, ConfettiBurst } from "./PandaAvatar";
import { generateQuestion, askPanda } from "@/lib/panda";
import { subscribeLatestGame, addGameDoc, setGameDoc, addGameHistory, addPoints } from "@/lib/gameFirestore";
import type { GameComponentProps } from "./GamePanel";

const TOTAL_QUESTIONS = 5;

interface QuizQuestion {
  question: string;
  options: string[];
  correct: string;
  hint?: string;
}

type Phase = "menu" | "loading" | "playing" | "done";

export function MemoryQuiz({ uid, partnerUid, partnerName, myName, memory, onSendToChat, onComplete }: GameComponentProps) {
  const [phase, setPhase] = useState<Phase>("menu");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<{ q: string; chosen: string; correct: boolean }[]>([]);
  const [pandaComment, setPandaComment] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [docId, setDocId] = useState<string | null>(null);
  const [isQuizTaker, setIsQuizTaker] = useState(false);

  const isPlayer1 = !partnerUid || uid < (partnerUid ?? "z");

  useEffect(() => {
    const unsub = subscribeLatestGame("memoryquiz", (data) => {
      if (!data) return;

      const status = data.status as string;
      const startedBy = data.startedBy as string;
      setDocId(data.id as string);
      setIsQuizTaker(startedBy === uid);

      if (status === "playing") {
        setQuestions(data.questions as QuizQuestion[]);
        setCurrentIdx((data.currentIdx as number) ?? 0);
        setScore((data.score as number) ?? 0);
        setAnswers((data.answers as { q: string; chosen: string; correct: boolean }[]) ?? []);
        setSelected((data.lastSelected as string) ?? null);
        if (startedBy === uid) setPhase("playing");
        else setPhase("spectating" as Phase);
      } else if (status === "done") {
        setQuestions(data.questions as QuizQuestion[]);
        setScore((data.score as number) ?? 0);
        setAnswers((data.answers as { q: string; chosen: string; correct: boolean }[]) ?? []);
        setPandaComment((data.pandaComment as string) ?? "");
        setShowConfetti((data.showConfetti as boolean) ?? false);
        setPhase("done");
      }
    });
    return unsub;
  }, [uid]);

  const startQuiz = async () => {
    setPhase("loading");
    setScore(0);
    setAnswers([]);
    setCurrentIdx(0);
    setSelected(null);
    setPandaComment("");
    setShowConfetti(false);
    setIsQuizTaker(true);
    try {
      const qs: QuizQuestion[] = [];
      for (let i = 0; i < TOTAL_QUESTIONS; i++) {
        const res = await generateQuestion("Memory Quiz", memory);
        const opts = res.options ?? ["Option A", "Option B", "Option C", "Option D"];
        qs.push({ question: res.question, options: opts, correct: opts[0], hint: res.hint });
      }
      const id = await addGameDoc("memoryquiz", {
        questions: qs,
        currentIdx: 0,
        score: 0,
        answers: [],
        lastSelected: null,
        status: "playing",
        startedBy: uid,
      });
      setDocId(id);
      setQuestions(qs);
      setPhase("playing");
    } catch {
      const fallback: QuizQuestion[] = [
        { question: "What is your partner's favorite color?", options: ["Red 🔴", "Blue 🔵", "Pink 💗", "Green 🟢"], correct: "Pink 💗" },
        { question: "What's your partner's dream vacation?", options: ["Paris 🗼", "Bali 🌴", "Maldives 🌊", "Tokyo 🗾"], correct: "Paris 🗼" },
        { question: "What's your partner's comfort food?", options: ["Chocolate 🍫", "Pizza 🍕", "Ice cream 🍦", "Biryani 🍚"], correct: "Ice cream 🍦" },
        { question: "What time does your partner usually wake up?", options: ["6 AM ⏰", "7 AM 🌅", "8 AM ☀️", "9 AM 🌤"], correct: "7 AM 🌅" },
        { question: "What is your partner's love language?", options: ["Words 💬", "Touch 🤗", "Gifts 🎁", "Acts 🛠"], correct: "Words 💬" },
      ];
      const id = await addGameDoc("memoryquiz", {
        questions: fallback,
        currentIdx: 0,
        score: 0,
        answers: [],
        lastSelected: null,
        status: "playing",
        startedBy: uid,
      });
      setDocId(id);
      setQuestions(fallback);
      setPhase("playing");
    }
  };

  const handleAnswer = async (opt: string) => {
    if (selected || !docId) return;
    setSelected(opt);
    const isCorrect = opt === questions[currentIdx]?.correct;
    const newScore = isCorrect ? score + 1 : score;
    const newAnswers = [...answers, { q: questions[currentIdx].question, chosen: opt, correct: isCorrect }];
    setAnswers(newAnswers);
    if (isCorrect) setScore(newScore);
    await setGameDoc("memoryquiz", docId, {
      score: newScore,
      answers: newAnswers,
      lastSelected: opt,
    });
  };

  const nextQuestion = async () => {
    setSelected(null);
    if (currentIdx + 1 >= TOTAL_QUESTIONS) {
      await finishQuiz();
    } else {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      if (docId) await setGameDoc("memoryquiz", docId, { currentIdx: nextIdx });
    }
  };

  const finishQuiz = async () => {
    const finalScore = answers.filter((a) => a.correct).length + (selected === questions[currentIdx]?.correct ? 1 : 0);
    const comment = await askPanda(
      `${myName} just scored ${finalScore}/${TOTAL_QUESTIONS} on a memory quiz about their relationship with ${partnerName}. Give a warm 1-sentence comment.`,
      memory
    );
    const confetti = finalScore >= TOTAL_QUESTIONS - 1;
    setPandaComment(comment);
    setShowConfetti(confetti);
    if (docId) {
      await setGameDoc("memoryquiz", docId, {
        status: "done",
        pandaComment: comment,
        showConfetti: confetti,
      });
    }
    await addPoints("player1", finalScore * 5);
    await addGameHistory("memoryquiz", `Score: ${finalScore}/${TOTAL_QUESTIONS}`);
    setPhase("done");
    onSendToChat({
      gameType: "memoryquiz",
      gameName: "Memory Quiz",
      emoji: "🧠",
      result: `Scored ${finalScore}/${TOTAL_QUESTIONS} (${finalScore * 5} pts)`,
      pandaComment: comment,
      score: finalScore,
    });
  };

  if (phase === "loading") return <PandaThinking label="Generating quiz questions…" />;

  if (phase === "menu") {
    return (
      <div className="flex flex-col gap-4 items-center text-center">
        <p className="text-4xl">🧠</p>
        <div>
          <p className="font-bold text-foreground">Memory Quiz</p>
          <p className="text-xs text-muted-foreground mt-1">
            Panda generates {TOTAL_QUESTIONS} questions about your relationship. How well do you know each other?
          </p>
        </div>
        <Button onClick={startQuiz} className="rounded-2xl w-full">Start Quiz 🧠</Button>
      </div>
    );
  }

  if ((phase as string) === "spectating") {
    const q = questions[currentIdx];
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-primary/5 rounded-2xl border border-primary/20 p-4 text-center">
          <p className="text-xs font-bold text-primary mb-1">📣 Cheering {partnerName.split(" ")[0]} on!</p>
          <p className="text-xs text-muted-foreground">Watch their progress live</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Question {currentIdx + 1}/{TOTAL_QUESTIONS}</span>
          <span className="text-xs font-bold text-primary">Score: {score}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${((currentIdx) / TOTAL_QUESTIONS) * 100}%` }} />
        </div>
        {q && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-sm font-semibold text-foreground">{q.question}</p>
            {q.hint && <p className="text-xs text-primary mt-1">💡 {q.hint}</p>}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 opacity-60 pointer-events-none">
          {q?.options.map((opt) => (
            <div key={opt} className="rounded-2xl px-3 py-2.5 text-xs font-medium text-left border border-border bg-card text-foreground">
              {opt}
            </div>
          ))}
        </div>
        <p className="text-xs text-center text-muted-foreground">Results will show when they finish 💕</p>
      </div>
    );
  }

  if (phase === "playing") {
    const q = questions[currentIdx];
    const isCorrectSelected = selected === q?.correct;
    return (
      <div className="flex flex-col gap-4 relative">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Question {currentIdx + 1}/{TOTAL_QUESTIONS}</span>
          <span className="text-xs font-bold text-primary">Score: {score}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${((currentIdx) / TOTAL_QUESTIONS) * 100}%` }} />
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm font-semibold text-foreground">{q?.question}</p>
          {q?.hint && <p className="text-xs text-primary mt-1">💡 {q.hint}</p>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {q?.options.map((opt) => {
            let cls = "border border-border hover:border-primary bg-card text-foreground";
            if (selected) {
              if (opt === q.correct) cls = "border-2 border-primary bg-primary/10 text-primary font-bold";
              else if (opt === selected && !isCorrectSelected) cls = "border-2 border-destructive bg-destructive/10 text-destructive";
              else cls = "border border-border bg-muted text-muted-foreground";
            }
            return (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                disabled={!!selected}
                className={`rounded-2xl px-3 py-2.5 text-xs font-medium text-left transition-all ${cls}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {selected && (
          <div className="flex flex-col gap-2">
            <div className={`rounded-2xl p-3 text-center text-sm font-bold ${isCorrectSelected ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
              {isCorrectSelected ? "Correct! 🎉" : `The answer was: ${q?.correct}`}
            </div>
            <Button onClick={nextQuestion} className="rounded-2xl">
              {currentIdx + 1 >= TOTAL_QUESTIONS ? "See Results" : "Next →"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  const finalScore = answers.filter((a) => a.correct).length;
  return (
    <div className="flex flex-col gap-4 relative">
      <ConfettiBurst active={showConfetti} />
      <div className="text-center bg-card border border-border rounded-2xl p-6">
        <p className="text-4xl mb-2">{finalScore >= TOTAL_QUESTIONS - 1 ? "🏆" : finalScore >= 3 ? "🌟" : "💕"}</p>
        <p className="text-2xl font-bold text-primary">{finalScore}/{TOTAL_QUESTIONS}</p>
        <p className="text-sm text-muted-foreground mt-1">+{finalScore * 5} points earned!</p>
        {!isQuizTaker && (
          <p className="text-xs text-muted-foreground mt-1">{partnerName.split(" ")[0]}'s result</p>
        )}
      </div>
      {pandaComment && <PandaBubble text={pandaComment} />}
      <Button onClick={startQuiz} className="w-full rounded-2xl">
        {isQuizTaker ? "Try Again 🧠" : "Take the Quiz 🧠"}
      </Button>
    </div>
  );
}
