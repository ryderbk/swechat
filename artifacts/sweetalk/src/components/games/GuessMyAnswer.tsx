import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PandaBubble, PandaThinking } from "./PandaAvatar";
import { generateQuestion, evaluateAnswer, generateReveal } from "@/lib/panda";
import { subscribeGameDoc, addGameDoc, setGameDoc, addGameHistory, addPoints, updatePandaMemory } from "@/lib/gameFirestore";
import type { GameComponentProps } from "./GamePanel";

export function GuessMyAnswer({ uid, partnerUid, partnerName, myName, memory, onSendToChat, onComplete }: GameComponentProps) {
  const [phase, setPhase] = useState<"loading" | "waiting_for_start" | "answering" | "guessing" | "waiting_for_partner" | "revealed">("loading");
  const [question, setQuestion] = useState("");
  const [myAnswer, setMyAnswer] = useState("");
  const [partnerAnswer, setPartnerAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [pandaComment, setPandaComment] = useState("");
  const [isRevealing, setIsRevealing] = useState(false);
  const [role, setRole] = useState<"answerer" | "guesser" | null>(null);

  const docId = memory.activeGameDocId;

  useEffect(() => {
    if (!docId) {
      setPhase("waiting_for_start");
      return;
    }

    const unsub = subscribeGameDoc("guessmyanswer", docId, (data) => {
      if (!data) return;

      setQuestion(data.question as string);
      const initiatorId = data.initiatorId as string;
      
      // The person who started the game is the GUESSER
      // The other person is the ANSWERER
      const isInitiator = uid === initiatorId;
      const myRole = isInitiator ? "guesser" : "answerer";
      setRole(myRole);

      const answererId = isInitiator ? partnerUid : uid;
      const answer = data.answer as string | null;
      const guess = data.guess as string | null;

      if (data.status === "revealed") {
        setScore(data.score as number || 0);
        setPandaComment(data.pandaComment as string || "");
        setMyAnswer(isInitiator ? (guess || "") : (answer || ""));
        setPartnerAnswer(isInitiator ? (answer || "") : (guess || ""));
        setPhase("revealed");
      } else if (myRole === "answerer") {
        if (answer) setPhase("waiting_for_partner");
        else setPhase("answering");
      } else if (myRole === "guesser") {
        if (answer) {
          if (guess) setPhase("waiting_for_partner");
          else setPhase("guessing");
        } else {
          setPhase("waiting_for_partner");
        }
      }
    });

    return unsub;
  }, [docId, uid, partnerUid]);

  const startNewRound = async () => {
    setPhase("loading");
    try {
      const res = await generateQuestion("Guess My Answer", memory);
      const id = await addGameDoc("guessmyanswer", {
        question: res.question,
        initiatorId: uid,
        answer: null,
        guess: null,
        status: "active",
      });
      await updatePandaMemory({ activeGameDocId: id });
    } catch (err) {
      console.error(err);
      setPhase("waiting_for_start");
    }
  };

  const submitAnswer = async () => {
    if (!myAnswer.trim() || !docId) return;
    await setGameDoc("guessmyanswer", docId, { answer: myAnswer });
  };

  const submitGuess = async () => {
    if (!myAnswer.trim() || !docId) return;
    setIsRevealing(true);
    try {
      // Get the real answer from the doc first to be sure
      const docData = await new Promise<any>((resolve) => {
        const u = subscribeGameDoc("guessmyanswer", docId, (data) => {
          u();
          resolve(data);
        });
      });

      const realAns = docData.answer as string;
      const myGuess = myAnswer;

      const result = await evaluateAnswer(question, realAns, myGuess);
      const revealComment = await generateReveal(question, realAns, myGuess, partnerName, myName);

      const finalComment = `${revealComment} ${result.pandaComment}`;

      await setGameDoc("guessmyanswer", docId, {
        guess: myGuess,
        score: result.score,
        pandaComment: finalComment,
        status: "revealed",
      });

      await addGameHistory("guessmyanswer", `Q: ${question} | Answerer (${partnerName}): ${realAns} | Guesser (${myName}): ${myGuess} | Score: ${result.score}`);
      
      if (result.score > 70) {
        await addPoints("player1", 10);
        await addPoints("player2", 10);
      }

      onSendToChat({
        gameType: "guessmyanswer",
        gameName: "Guess & Reveal",
        emoji: "🔍",
        result: `Guessed ${result.score}% of ${partnerName}'s answer!`,
        pandaComment: finalComment,
        score: result.score,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsRevealing(false);
    }
  };

  if (phase === "loading" || isRevealing) return <PandaThinking label={isRevealing ? "Panda is checking..." : "Panda is fetching a question..."} />;

  if (phase === "waiting_for_start") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8">
        <div className="text-center">
          <p className="text-4xl mb-4">🔍</p>
          <h3 className="text-lg font-bold text-foreground">Guess & Reveal</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-[200px]">
            One person answers, the other guesses. Sync up!
          </p>
        </div>
        <Button onClick={startNewRound} className="rounded-2xl px-8 py-6 h-auto text-base font-bold shadow-lg">
          Start Round 🐼
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card border border-border rounded-2xl p-5 text-center shadow-sm">
        <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-3">The Question</p>
        <p className="text-lg font-semibold text-foreground leading-snug">{question}</p>
      </div>

      {phase === "answering" && (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="space-y-2">
            <p className="text-xs text-center text-muted-foreground">Answer this secretly — {partnerName} will try to guess it!</p>
            <Input
              value={myAnswer}
              onChange={(e) => setMyAnswer(e.target.value)}
              placeholder="Your secret answer..."
              className="rounded-2xl h-12 px-4 border-2"
              autoFocus
            />
          </div>
          <Button onClick={submitAnswer} disabled={!myAnswer.trim()} className="rounded-2xl h-12 font-bold">
            Set Answer 🔒
          </Button>
        </div>
      )}

      {phase === "guessing" && (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="space-y-2">
            <p className="text-xs text-center text-muted-foreground">What do you think {partnerName} answered?</p>
            <Input
              value={myAnswer}
              onChange={(e) => setMyAnswer(e.target.value)}
              placeholder="Take a guess..."
              className="rounded-2xl h-12 px-4 border-2 border-primary/30"
              autoFocus
            />
          </div>
          <Button onClick={submitGuess} disabled={!myAnswer.trim()} className="rounded-2xl h-12 font-bold shadow-md shadow-primary/10">
            Submit Guess 🎯
          </Button>
        </div>
      )}

      {phase === "waiting_for_partner" && (
        <div className="text-center py-10 bg-primary/5 rounded-2xl border border-primary/10">
          <div className="flex justify-center gap-1 mb-4">
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
          </div>
          <p className="text-sm font-medium text-primary">
            {role === "guesser" ? `Waiting for ${partnerName} to answer...` : `Waiting for ${partnerName} to guess...`}
          </p>
        </div>
      )}

      {phase === "revealed" && (
        <div className="flex flex-col gap-4 animate-in zoom-in-95 duration-300">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">
                {role === "answerer" ? "Your Answer" : `${partnerName}'s Answer`}
              </p>
              <p className="text-sm font-medium text-foreground">{role === "answerer" ? myAnswer : partnerAnswer}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">
                {role === "guesser" ? "Your Guess" : `${partnerName}'s Guess`}
              </p>
              <p className="text-sm font-medium text-foreground">{role === "guesser" ? myAnswer : partnerAnswer}</p>
            </div>
          </div>
          
          <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5 text-center">
            <p className="text-[10px] text-primary font-bold uppercase tracking-[0.2em] mb-1">Match Score</p>
            <p className="text-4xl font-black text-primary">{score}%</p>
          </div>

          {pandaComment && (
            <div className="mt-2">
              <PandaBubble text={pandaComment} />
            </div>
          )}
          
          <Button onClick={startNewRound} variant="outline" className="w-full rounded-2xl h-12 font-bold border-2 mt-2">
            Play Again 🔍
          </Button>
        </div>
      )}
    </div>
  );
}
