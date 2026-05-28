import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PandaBubble, PandaThinking } from "./PandaAvatar";
import { generateQuestion, askPanda } from "@/lib/panda";
import { subscribeLatestGame, addGameDoc, setGameDoc, addGameHistory } from "@/lib/gameFirestore";
import type { GameComponentProps } from "./GamePanel";

const CATEGORIES = [
  { id: "dreams",    emoji: "🌟", label: "Dreams & Future" },
  { id: "memories",  emoji: "📸", label: "Memories" },
  { id: "love",      emoji: "💕", label: "Love & Affection" },
  { id: "fun",       emoji: "🎉", label: "Fun & Silly" },
  { id: "deep",      emoji: "🌊", label: "Deep & Meaningful" },
  { id: "surprise",  emoji: "🎲", label: "Panda's Choice" },
];

export function RandomQuestion({ uid, partnerUid, partnerName, myName, memory, onSendToChat, onComplete }: GameComponentProps) {
  const [phase, setPhase] = useState<"menu" | "loading" | "question">("menu");
  const [question, setQuestion] = useState("");
  const [hint, setHint] = useState("");
  const [category, setCategory] = useState("");
  const [answered, setAnswered] = useState(false);
  const [pandaComment, setPandaComment] = useState("");
  const [docId, setDocId] = useState<string | null>(null);
  const [askedBy, setAskedBy] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeLatestGame("randomquestion", (data) => {
      if (!data) return;
      const status = data.status as string;
      setDocId(data.id as string);
      setQuestion(data.question as string ?? "");
      setHint((data.hint as string) ?? "");
      setCategory((data.category as string) ?? "");
      setAskedBy(data.askedBy as string);
      if (status === "active") {
        setAnswered(false);
        setPandaComment("");
        setPhase("question");
      } else if (status === "answered") {
        setAnswered(true);
        setPandaComment((data.pandaComment as string) ?? "");
        setPhase("question");
      }
    });
    return unsub;
  }, []);

  const pickQuestion = async (cat: typeof CATEGORIES[0]) => {
    setCategory(cat.label);
    setPhase("loading");
    setAnswered(false);
    setPandaComment("");
    try {
      const res = await generateQuestion("Random Question", memory, cat.label);
      const id = await addGameDoc("randomquestion", {
        question: res.question,
        hint: res.hint ?? "",
        category: cat.label,
        status: "active",
        answered: false,
        pandaComment: "",
        askedBy: uid,
      });
      setDocId(id);
    } catch {
      const fallback = "What is the most meaningful moment in your relationship so far?";
      const id = await addGameDoc("randomquestion", {
        question: fallback,
        hint: "Think about what brought you closer 💕",
        category: cat.label,
        status: "active",
        answered: false,
        pandaComment: "",
        askedBy: uid,
      });
      setDocId(id);
    }
  };

  const markAnswered = async () => {
    if (!docId) return;
    setAnswered(true);
    const comment = await askPanda(
      `${myName} and ${partnerName} just discussed: "${question}". Give a warm, thoughtful 1-sentence closing remark. Max 15 words.`,
      memory
    );
    setPandaComment(comment);
    await setGameDoc("randomquestion", docId, {
      answered: true,
      status: "answered",
      pandaComment: comment,
    });
    await addGameHistory("randomquestion", question);
    onSendToChat({
      gameType: "randomquestion",
      gameName: "Random Question",
      emoji: "❓",
      result: `"${question}"`,
      pandaComment: comment,
    });
  };

  if (phase === "loading") return <PandaThinking label="Panda is picking the perfect question…" />;

  if (phase === "menu") {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <p className="text-3xl mb-1">❓</p>
          <p className="font-bold text-foreground">Random Question</p>
          <p className="text-xs text-muted-foreground mt-1">Panda asks, you both discuss. Pick a category to get started.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => pickQuestion(c)}
              className="bg-gradient-to-br from-primary/10 to-primary/5 border border-border rounded-2xl p-3 text-left hover:border-primary hover:scale-[1.02] transition-all"
            >
              <p className="text-xl mb-1">{c.emoji}</p>
              <p className="text-xs font-semibold text-foreground leading-tight">{c.label}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 justify-center">
        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{category}</span>
        {askedBy && askedBy !== uid && (
          <span className="text-xs text-muted-foreground">from {partnerName.split(" ")[0]}</span>
        )}
      </div>

      <div className="bg-card border-2 border-primary/20 rounded-2xl p-5 text-center">
        <p className="text-base font-semibold text-foreground leading-relaxed">{question}</p>
        {hint && <p className="text-xs text-primary mt-2 italic">💡 {hint}</p>}
      </div>

      <div className="bg-muted/50 rounded-2xl p-3 text-center">
        <p className="text-xs text-muted-foreground">Discuss this question with {partnerName}, then mark it as done 💕</p>
      </div>

      {!answered ? (
        <Button onClick={markAnswered} className="w-full rounded-2xl">We discussed it! ✅</Button>
      ) : (
        <div className="flex flex-col gap-3">
          {pandaComment && <PandaBubble text={pandaComment} />}
          <Button onClick={() => setPhase("menu")} className="w-full rounded-2xl">New Question ❓</Button>
        </div>
      )}

      {!answered && (
        <button
          onClick={() => pickQuestion(CATEGORIES.find((c) => c.label === category) ?? CATEGORIES[5])}
          className="text-xs text-muted-foreground text-center hover:text-primary transition-colors"
        >
          Skip this one →
        </button>
      )}
    </div>
  );
}
