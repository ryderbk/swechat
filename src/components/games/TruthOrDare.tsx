import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PandaBubble, PandaThinking } from "./PandaAvatar";
import { askPanda } from "@/lib/panda";
import { getRandomQuestion } from "@/lib/questions";
import { subscribeLatestGame, addGameDoc, setGameDoc, addGameHistory } from "@/lib/gameFirestore";
import type { GameComponentProps } from "./GamePanel";

type Phase = "menu" | "loading" | "playing" | "waiting_for_partner";

const CATEGORIES = [
  { id: "sweet",  label: "Sweet 💕",  desc: "Romantic & cute" },
  { id: "funny",  label: "Funny 😄",  desc: "Silly & playful" },
  { id: "deep",   label: "Deep 🌊",   desc: "Meaningful & personal" },
  { id: "spicy",  label: "Spicy 🌶",  desc: "Daring & bold" },
];

export function TruthOrDare({ uid, partnerUid, partnerName, myName, memory, onSendToChat, onComplete }: GameComponentProps) {
  const [phase, setPhase] = useState<Phase>("menu");
  const [type, setType] = useState<"truth" | "dare" | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [done, setDone] = useState(false);
  const [pandaComment, setPandaComment] = useState("");
  const [docId, setDocId] = useState<string | null>(null);
  const [initiatorId, setInitiatorId] = useState<string | null>(null);

  const isPlayer1 = !partnerUid || uid < (partnerUid ?? "z");

  useEffect(() => {
    const unsub = subscribeLatestGame("truthordare", (data) => {
      if (!data) {
        setPhase("menu");
        setDocId(null);
        return;
      }

      const status = data.status as string;
      const dInitiator = data.initiatorId as string;
      setDocId(data.id as string);
      setInitiatorId(dInitiator);

      if (status === "selecting") {
        if (dInitiator === uid) {
          setPhase("menu");
        } else {
          setPhase("waiting_for_partner");
        }
      } else if (status === "playing") {
        setType(data.type as "truth" | "dare");
        setCategory(data.category as string);
        setPrompt(data.prompt as string ?? "");
        setDone(false);
        setPandaComment("");
        setPhase("playing");
      } else if (status === "done") {
        setType(data.type as "truth" | "dare");
        setCategory(data.category as string);
        setPrompt(data.prompt as string ?? "");
        setPandaComment(data.pandaComment as string ?? "");
        setDone(true);
        setPhase("playing");
      }
    });
    return unsub;
  }, [uid]);

  const startSelectingRound = async () => {
    const id = await addGameDoc("truthordare", {
      status: "selecting",
      initiatorId: uid,
      type: null,
      category: null,
      prompt: null,
      done: false,
      pandaComment: "",
    });
    setDocId(id);
    setInitiatorId(uid);
    setType(null);
    setPhase("menu");
  };

  const generate = async (t: "truth" | "dare") => {
    setPhase("loading");
    setDone(false);
    setPandaComment("");
    
    // We try to find a question of the requested type from our list
    let res = getRandomQuestion("truthordare");
    // Retry a few times to get the right type if needed (since they are mixed in the 100)
    for (let i = 0; i < 10; i++) {
      if (res.type === t) break;
      res = getRandomQuestion("truthordare");
    }

    const cleanPrompt = res.question;
    if (docId) {
      await setGameDoc("truthordare", docId, {
        type: t,
        category: "Classic",
        prompt: cleanPrompt,
        status: "playing",
        done: false,
      });
    } else {
      const id = await addGameDoc("truthordare", {
        type: t,
        category: "Classic",
        prompt: cleanPrompt,
        status: "playing",
        done: false,
        pandaComment: "",
        initiatorId: uid,
      });
      setDocId(id);
    }
    setPhase("playing");
  };

  const markDone = async () => {
    if (!docId) return;
    const comment = await askPanda(
      `${myName} just completed a ${type} in Truth or Dare with ${partnerName}. Category: ${category}. Give a warm, playful 1-sentence cheer. Max 15 words.`,
      memory
    );
    await setGameDoc("truthordare", docId, {
      done: true,
      status: "done",
      pandaComment: comment,
    });
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

  if (phase === "waiting_for_partner") {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-4xl">🎭</p>
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
        </div>
        <p className="text-sm font-medium text-foreground text-center">
          {partnerName} is choosing Truth or Dare…
        </p>
        <p className="text-xs text-muted-foreground">Get ready for a challenge! 💕</p>
      </div>
    );
  }

  if (phase === "menu") {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <p className="text-3xl mb-1">🎭</p>
          <p className="font-bold text-foreground">Truth or Dare</p>
          <p className="text-xs text-muted-foreground mt-1">Pick your poison, then choose a vibe</p>
        </div>

        {!docId && (
          <div className="bg-muted/50 rounded-2xl p-3 text-center mb-2">
            <p className="text-xs text-muted-foreground">
              {isPlayer1 ? "You're setting up the round — partner will wait for your pick" : `Waiting for ${partnerName} to start a round…`}
            </p>
          </div>
        )}

        {(isPlayer1 || docId) && (
          <>
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
                <p className="text-xs text-muted-foreground text-center font-medium">Ready?</p>
                <button
                  onClick={() => {
                    if (!docId) {
                      startSelectingRound().then(() => generate(type));
                    } else {
                      generate(type);
                    }
                  }}
                  className="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary rounded-2xl px-4 py-4 text-center hover:bg-primary/20 transition-all"
                >
                  <p className="text-sm font-bold text-foreground">Get Random {type === 'truth' ? 'Truth' : 'Dare'} 🎲</p>
                </button>
              </div>
            )}
          </>
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
          <Button
            onClick={startSelectingRound}
            className="w-full rounded-2xl"
          >
            Next Round 🎭
          </Button>
        </div>
      )}

      {!done && (
        <button
          onClick={() => generate(type!)}
          className="text-xs text-muted-foreground text-center hover:text-primary transition-colors"
        >
          Skip this one →
        </button>
      )}
    </div>
  );
}
