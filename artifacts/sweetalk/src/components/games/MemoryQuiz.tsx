import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PandaBubble, PandaThinking, ConfettiBurst } from "./PandaAvatar";
import { generateQuestion, askPanda } from "@/lib/panda";
import { addGameHistory, addPoints } from "@/lib/gameFirestore";
import type { GameComponentProps } from "./GamePanel";

const TOTAL_QUESTIONS = 5;

interface QuizQuestion {
  question: string;
  options: string[];
  correct: string;
  hint?: string;
}

export function MemoryQuiz({ uid, partnerUid, partnerName, myName, memory, onSendToChat, onComplete }: GameComponentProps) {
  const [phase, setPhase] = useState<"menu" | "loading" | "playing" | "done">("menu");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<{ q: string; chosen: string; correct: boolean }[]>([]);
  const [pandaComment, setPandaComment] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const startQuiz = async () => {
    setPhase("loading");
    setScore(0);
    setAnswers([]);
    setCurrentIdx(0);
    setSelected(null);
    setPandaComment("");
    setShowConfetti(false);
    try {
      const qs: QuizQuestion[] = [];
      for (let i = 0; i < TOTAL_QUESTIONS; i++) {
        const res = await generateQuestion("Memory Quiz", memory);
        const opts = res.options ?? ["Option A", "Option B", "Option C", "Option D"];
        qs.push({ question: res.question, options: opts, correct: opts[0], hint: res.hint });
      }
      setQuestions(qs);
      setPhase("playing");
    } catch {
      setQuestions([
        { question: "What is your partner's favorite color?", options: ["Red 🔴", "Blue 🔵", "Pink 💗", "Green 🟢"], correct: "Pink 💗" },
        { question: "What's your partner's dream vacation?", options: ["Paris 🗼", "Bali 🌴", "Maldives 🌊", "Tokyo 🗾"], correct: "Paris 🗼" },
        { question: "What's your partner's comfort food?", options: ["Chocolate 🍫", "Pizza 🍕", "Ice cream 🍦", "Biryani 🍚"], correct: "Ice cream 🍦" },
        { question: "What time does your partner usually wake up?", options: ["6 AM ⏰", "7 AM 🌅", "8 AM ☀️", "9 AM 🌤"], correct: "7 AM 🌅" },
        { question: "What is your partner's love language?", options: ["Words 💬", "Touch 🤗", "Gifts 🎁", "Acts 🛠"], correct: "Words 💬" },
      ]);
      setPhase("playing");
    }
  };

  const handleAnswer = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    const isCorrect = opt === questions[currentIdx]?.correct;
    const newAnswers = [...answers, { q: questions[currentIdx].question, chosen: opt, correct: isCorrect }];
    setAnswers(newAnswers);
    if (isCorrect) setScore((s) => s + 1);
  };

  const nextQuestion = async () => {
    setSelected(null);
    if (currentIdx + 1 >= TOTAL_QUESTIONS) {
      await finishQuiz();
    } else {
      setCurrentIdx((i) => i + 1);
    }
  };

  const finishQuiz = async () => {
    const finalScore = answers.filter((a) => a.correct).length + (selected === questions[currentIdx]?.correct ? 1 : 0);
    const comment = await askPanda(
      `${myName} just scored ${finalScore}/${TOTAL_QUESTIONS} on a memory quiz about their relationship with ${partnerName}. Give a warm 1-sentence comment.`,
      memory
    );
    setPandaComment(comment);
    if (finalScore >= TOTAL_QUESTIONS - 1) setShowConfetti(true);
    const pts = finalScore * 5;
    await addPoints("player1", pts);
    await addGameHistory("memoryquiz", `Score: ${finalScore}/${TOTAL_QUESTIONS}`);
    setPhase("done");
    onSendToChat({
      gameType: "memoryquiz",
      gameName: "Memory Quiz",
      emoji: "🧠",
      result: `Scored ${finalScore}/${TOTAL_QUESTIONS} (${pts} pts)`,
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
          <p className="text-xs text-muted-foreground mt-1">Panda generates {TOTAL_QUESTIONS} questions about your relationship. How well do you know each other?</p>
        </div>
        <Button onClick={startQuiz} className="rounded-2xl w-full">Start Quiz 🧠</Button>
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
      </div>
      {pandaComment && <PandaBubble text={pandaComment} />}
      <Button onClick={startQuiz} className="w-full rounded-2xl">Try Again 🧠</Button>
    </div>
  );
}
