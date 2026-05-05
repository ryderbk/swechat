import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PandaBubble, PandaThinking } from "./PandaAvatar";
import { askPanda } from "@/lib/panda";
import { addGameHistory } from "@/lib/gameFirestore";
import type { GameComponentProps } from "./GamePanel";

const CATEGORIES = [
  { id: "sweet", label: "Sweet 💕", desc: "Romantic & cute" },
  { id: "funny", label: "Funny 😄", desc: "Silly & playful" },
  { id: "deep", label: "Deep 🌊", desc: "Meaningful & personal" },
  { id: "spicy", label: "Spicy 🌶", desc: "Daring & bold" },
];

export function TruthOrDare({ uid, partnerUid, partnerName, myName, memory, onSendToChat, onComplete }: GameComponentProps) {
  const [phase, setPhase] = useState<"menu" | "loading" | "playing">("menu");
  const [type, setType] = useState<"truth" | "dare" | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [done, setDone] = useState(false);
  const [pandaComment, setPandaComment] = useState("");

  const generate = async (t: "truth" | "dare", cat: string) => {
    setType(t);
    setCategory(cat);
    setPhase("loading");
    setDone(false);
    setPandaComment("");
    const catLabel = CATEGORIES.find((c) => c.id === cat)?.label ?? cat;
    const q = await askPanda(
      `Generate one ${t === "truth" ? "truth question" : "dare challenge"} for ${myName} in a ${catLabel} couples game. Make it ${cat === "sweet" ? "romantic and heartfelt" : cat === "funny" ? "funny and playful" : cat === "deep" ? "thoughtful and meaningful" : "bold and daring but appropriate for couples"}. Just the ${t} prompt, no intro. Max 25 words.`,
      memory
    );
    setPrompt(q.replace(/^["']|["']$/g, ""));
    setPhase("playing");
  };

  const markDone = async () => {
    setDone(true);
    const comment = await askPanda(
      `${myName} just completed a ${type} in Truth or Dare with ${partnerName}. Category: ${category}. Give a warm, playful 1-sentence cheer. Max 15 words.`,
      memory
    );
    setPandaComment(comment);
    await addGameHistory("truthordare", `${type} — ${category}`);
    onSendToChat({
      gameType: "truthordare",
      gameName: "Truth or Dare",
      emoji: "🎭",
      result: `${myName} did a ${category} ${type}!`,
      pandaComment: comment,
    });
  };

  if (phase === "loading") return <PandaThinking label="Panda is thinking of a challenge…" />;

  if (phase === "menu") {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <p className="text-3xl mb-1">🎭</p>
          <p className="font-bold text-foreground">Truth or Dare</p>
          <p className="text-xs text-muted-foreground mt-1">Pick your poison, then choose a vibe</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setType("truth")}
            className={`rounded-2xl border-2 p-4 text-center transition-all ${type === "truth" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
          >
            <p className="text-2xl mb-1">🙋</p>
            <p className="font-bold text-sm text-foreground">Truth</p>
            <p className="text-[10px] text-muted-foreground">Be honest</p>
          </button>
          <button
            onClick={() => setType("dare")}
            className={`rounded-2xl border-2 p-4 text-center transition-all ${type === "dare" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
          >
            <p className="text-2xl mb-1">🎯</p>
            <p className="font-bold text-sm text-foreground">Dare</p>
            <p className="text-[10px] text-muted-foreground">Be bold</p>
          </button>
        </div>

        {type && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground text-center font-medium">Choose your vibe</p>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => generate(type, c.id)}
                className="bg-gradient-to-r from-primary/10 to-primary/5 border border-border rounded-2xl px-4 py-3 text-left hover:border-primary transition-all flex items-center gap-3"
              >
                <span className="text-xl">{c.label.split(" ")[1]}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{c.label.split(" ")[0]}</p>
                  <p className="text-[10px] text-muted-foreground">{c.desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <span className="inline-block bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {type} · {CATEGORIES.find((c) => c.id === category)?.label}
        </span>
      </div>

      <div className="bg-card border-2 border-primary/30 rounded-2xl p-6 text-center">
        <p className="text-base font-semibold text-foreground leading-relaxed">{prompt}</p>
      </div>

      {!done ? (
        <Button onClick={markDone} className="w-full rounded-2xl">
          Done! ✅
        </Button>
      ) : (
        <div className="flex flex-col gap-3">
          {pandaComment && <PandaBubble text={pandaComment} />}
          <Button onClick={() => { setPhase("menu"); setType(null); }} className="w-full rounded-2xl">
            Next Round 🎭
          </Button>
        </div>
      )}

      <button
        onClick={() => generate(type!, category!)}
        className="text-xs text-muted-foreground text-center hover:text-primary transition-colors"
      >
        Skip this one →
      </button>
    </div>
  );
}
