import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PandaBubble, PandaThinking } from "./PandaAvatar";
import { askPanda, generateReveal } from "@/lib/panda";
import { subscribeLatestGame, addGameDoc, setGameDoc, addGameHistory } from "@/lib/gameFirestore";
import type { GameComponentProps } from "./GamePanel";

type Phase = "loading" | "completing" | "waiting" | "waiting_for_round" | "revealed";

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

export function CompleteSentence({ uid, partnerUid, partnerName, myName, memory, onSendToChat, onComplete }: GameComponentProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [starter, setStarter] = useState("");
  const [myCompletion, setMyCompletion] = useState("");
  const [partnerCompletion, setPartnerCompletion] = useState<string | null>(null);
  const [draftCompletion, setDraftCompletion] = useState("");
  const [docId, setDocId] = useState<string | null>(null);
  const [pandaComment, setPandaComment] = useState("");

  const isPlayer1 = !partnerUid || uid < (partnerUid ?? "z");
  const myField = isPlayer1 ? "completion1" : "completion2";

  const startRound = async () => {
    setPhase("loading");
    setMyCompletion("");
    setPartnerCompletion(null);
    setPandaComment("");
    setDraftCompletion("");
    try {
      const s = await askPanda(
        `Give ${myName} and ${partnerName} one romantic sentence starter to complete together. Just the unfinished sentence ending with "..." — no intro. Max 12 words. Examples: "The moment I knew I loved you was...", "What makes our love special is..."`,
        memory
      );
      const clean = s.replace(/^["']|["']$/g, "");
      const id = await addGameDoc("completesentence", {
        starter: clean,
        completion1: null,
        completion2: null,
        status: "completing",
      });
      setDocId(id);
    } catch {
      const id = await addGameDoc("completesentence", {
        starter: "What makes our relationship different from others is…",
        completion1: null,
        completion2: null,
        status: "completing",
      });
      setDocId(id);
    }
  };

  useEffect(() => {
    const unsub = subscribeLatestGame("completesentence", (data) => {
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
      setStarter(data.starter as string ?? "");

      const mine = isPlayer1 ? data.completion1 : data.completion2;
      const theirs = isPlayer1 ? data.completion2 : data.completion1;
      if (mine) setMyCompletion(mine as string);
      if (theirs) setPartnerCompletion(theirs as string);

      if (status === "completing") {
        if (!mine) setPhase("completing");
        else setPhase("waiting");
      } else if (status === "revealed") {
        setPandaComment(data.pandaComment as string ?? "");
        setPhase("revealed");
      }
    });
    return unsub;
  }, [isPlayer1]);

  const submitCompletion = async () => {
    if (!draftCompletion.trim() || !docId) return;
    const comp = draftCompletion.trim();
    setMyCompletion(comp);
    await setGameDoc("completesentence", docId, { [myField]: comp });
    setPhase("waiting");
  };

  useEffect(() => {
    if (myCompletion && partnerCompletion && docId && phase === "waiting" && isPlayer1) {
      doReveal();
    }
  }, [myCompletion, partnerCompletion, phase]);

  const doReveal = async () => {
    if (!docId) return;
    const comment = await generateReveal(starter, myCompletion, partnerCompletion!, myName, partnerName);
    await setGameDoc("completesentence", docId, { status: "revealed", pandaComment: comment });
    await addGameHistory("completesentence", `"${starter}" — ${myName}: "${myCompletion}", ${partnerName}: "${partnerCompletion}"`);
    onSendToChat({
      gameType: "completesentence",
      gameName: "Complete the Sentence",
      emoji: "✍️",
      result: `${myName}: "${myCompletion}" · ${partnerName}: "${partnerCompletion}"`,
      pandaComment: comment,
    });
  };

  if (phase === "loading") return <PandaThinking label="Panda is writing a sentence starter…" />;
  if (phase === "waiting_for_round") return <WaitingForRound partnerName={partnerName} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card border border-border rounded-2xl p-4 text-center">
        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Complete the Sentence ✍️</p>
        <p className="text-base font-semibold text-foreground leading-snug italic">"{starter}"</p>
      </div>

      {phase === "completing" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground text-center">Finish the sentence in your own words — both answers revealed together</p>
          <Input
            value={draftCompletion}
            onChange={(e) => setDraftCompletion(e.target.value)}
            placeholder="…your ending here"
            className="rounded-2xl"
            onKeyDown={(e) => e.key === "Enter" && submitCompletion()}
          />
          <Button onClick={submitCompletion} disabled={!draftCompletion.trim()} className="rounded-2xl">
            Submit my ending 🔒
          </Button>
        </div>
      )}

      {phase === "waiting" && (
        <div className="text-center py-6">
          <p className="text-4xl mb-3 animate-bounce">⏳</p>
          <p className="text-sm font-medium text-foreground">Your ending is locked!</p>
          <p className="text-xs text-muted-foreground mt-1">Waiting for {partnerName}…</p>
        </div>
      )}

      {phase === "revealed" && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-2">
            <div className="rounded-2xl border border-border bg-primary/5 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">You said</p>
              <p className="text-sm font-medium text-foreground italic">"{myCompletion}"</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{partnerName} said</p>
              <p className="text-sm font-medium text-foreground italic">"{partnerCompletion}"</p>
            </div>
          </div>
          {pandaComment && <PandaBubble text={pandaComment} />}
          {isPlayer1 ? (
            <Button onClick={startRound} className="w-full rounded-2xl">New Sentence ✍️</Button>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground">Waiting for {partnerName} to start a new round…</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
