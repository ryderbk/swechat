import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PandaBubble, PandaThinking } from "./PandaAvatar";
import { askPanda, generateReveal } from "@/lib/panda";
import { subscribeLatestGame, addGameDoc, setGameDoc, addGameHistory } from "@/lib/gameFirestore";
import type { GameComponentProps } from "./GamePanel";

export function CompleteSentence({ uid, partnerUid, partnerName, myName, memory, onSendToChat, onComplete }: GameComponentProps) {
  const [phase, setPhase] = useState<"loading" | "completing" | "waiting" | "revealed">("loading");
  const [starter, setStarter] = useState("");
  const [myCompletion, setMyCompletion] = useState("");
  const [partnerCompletion, setPartnerCompletion] = useState<string | null>(null);
  const [draftCompletion, setDraftCompletion] = useState("");
  const [docId, setDocId] = useState<string | null>(null);
  const [pandaComment, setPandaComment] = useState("");

  const isPlayer1 = !partnerUid || uid < (partnerUid ?? "z");
  const myField = isPlayer1 ? "completion1" : "completion2";
  const partnerField = isPlayer1 ? "completion2" : "completion1";

  const startRound = async () => {
    setPhase("loading");
    setMyCompletion("");
    setPartnerCompletion(null);
    setPandaComment("");
    try {
      const s = await askPanda(
        `Give ${myName} and ${partnerName} one romantic sentence starter to complete together. Just the unfinished sentence ending with "..." — no intro. Max 12 words. Examples: "The moment I knew I loved you was...", "What makes our love special is..."`,
        memory
      );
      const clean = s.replace(/^["']|["']$/g, "");
      setStarter(clean);
      const id = await addGameDoc("completesentence", {
        starter: clean,
        completion1: null,
        completion2: null,
        status: "completing",
      });
      setDocId(id);
      setPhase("completing");
    } catch {
      setStarter("What makes our relationship different from others is…");
      setPhase("completing");
    }
  };

  useEffect(() => {
    const unsub = subscribeLatestGame("completesentence", (data) => {
      if (!data) { startRound(); return; }
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
    if (myCompletion && partnerCompletion && docId && phase === "waiting") {
      doReveal();
    }
  }, [myCompletion, partnerCompletion, phase]);

  const doReveal = async () => {
    if (!docId) return;
    const comment = await generateReveal(starter, myCompletion, partnerCompletion!, myName, partnerName);
    setPandaComment(comment);
    await setGameDoc("completesentence", docId, { status: "revealed", pandaComment: comment });
    await addGameHistory("completesentence", `"${starter}" — ${myName}: "${myCompletion}", ${partnerName}: "${partnerCompletion}"`);
    setPhase("revealed");
    onSendToChat({
      gameType: "completesentence",
      gameName: "Complete the Sentence",
      emoji: "✍️",
      result: `${myName}: "${myCompletion}" · ${partnerName}: "${partnerCompletion}"`,
      pandaComment: comment,
    });
  };

  if (phase === "loading") return <PandaThinking label="Panda is writing a sentence starter…" />;

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
          <Button onClick={startRound} className="w-full rounded-2xl">New Sentence ✍️</Button>
        </div>
      )}
    </div>
  );
}
