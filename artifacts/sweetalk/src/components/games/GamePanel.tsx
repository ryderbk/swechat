import { useState, useEffect } from "react";
import { X, Trophy, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GameData } from "@/lib/firestore";
import type { PandaGameMemory } from "@/lib/panda";
import { getPandaMemory, subscribePandaMemory } from "@/lib/gameFirestore";

import { ThisOrThat } from "./ThisOrThat";
import { AnswerReveal } from "./AnswerReveal";
import { GuessMyAnswer } from "./GuessMyAnswer";
import { SecretUnlock } from "./SecretUnlock";
import { OneQuestionADay } from "./OneQuestionADay";
import { MemoryQuiz } from "./MemoryQuiz";
import { TruthOrDare } from "./TruthOrDare";
import { CompleteSentence } from "./CompleteSentence";
import { RapidFire } from "./RapidFire";
import { RandomQuestion } from "./RandomQuestion";
import { Scoreboard } from "./Scoreboard";
import { MoodSync } from "./MoodSync";
import { BuildOurWorld } from "./BuildOurWorld";
import { AskPanda } from "./AskPanda";

interface GamePanelProps {
  uid: string;
  partnerUid: string | null;
  partnerName: string;
  myName: string;
  onSendToChat: (gameData: GameData) => void;
  onClose: () => void;
}

interface GameMeta {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  color: string;
}

const GAMES: GameMeta[] = [
  { id: "thisorthat",       name: "This or That",         emoji: "🎲", desc: "Pick your side",           color: "from-rose-400/20 to-pink-300/20" },
  { id: "answerreveal",     name: "Answer & Reveal",      emoji: "💬", desc: "Compare answers",          color: "from-purple-400/20 to-violet-300/20" },
  { id: "guessmyanswer",    name: "Guess My Answer",      emoji: "🔍", desc: "How well do you know me?", color: "from-blue-400/20 to-cyan-300/20" },
  { id: "secretunlock",     name: "Secret Unlock",        emoji: "🔓", desc: "Crack my secret",          color: "from-amber-400/20 to-yellow-300/20" },
  { id: "dailyquestion",    name: "Daily Question",       emoji: "📅", desc: "One question per day",     color: "from-emerald-400/20 to-green-300/20" },
  { id: "memoryquiz",       name: "Memory Quiz",          emoji: "🧠", desc: "Test your memory",         color: "from-orange-400/20 to-red-300/20" },
  { id: "truthordare",      name: "Truth or Dare",        emoji: "🎭", desc: "Bold or honest?",          color: "from-pink-400/20 to-rose-300/20" },
  { id: "completesentence", name: "Complete the Sentence",emoji: "✍️", desc: "Finish the thought",       color: "from-indigo-400/20 to-blue-300/20" },
  { id: "rapidfire",        name: "Rapid Fire",           emoji: "⚡", desc: "No time to think",         color: "from-yellow-400/20 to-amber-300/20" },
  { id: "randomquestion",   name: "Random Question",      emoji: "❓", desc: "Panda picks the topic",    color: "from-teal-400/20 to-emerald-300/20" },
  { id: "scoreboard",       name: "Scoreboard",           emoji: "📊", desc: "Our game stats",           color: "from-slate-400/20 to-gray-300/20" },
  { id: "moodsync",         name: "Mood Sync",            emoji: "😊", desc: "How are you feeling?",    color: "from-fuchsia-400/20 to-pink-300/20" },
  { id: "buildourworld",    name: "Build Our World",      emoji: "🌍", desc: "Unlock your story",        color: "from-lime-400/20 to-green-300/20" },
  { id: "askpanda",         name: "Ask Panda",            emoji: "🐼", desc: "AI advice for couples",    color: "from-primary/20 to-primary/10" },
];

const GAME_MAP: Record<string, React.ComponentType<GameComponentProps>> = {
  thisorthat: ThisOrThat,
  answerreveal: AnswerReveal,
  guessmyanswer: GuessMyAnswer,
  secretunlock: SecretUnlock,
  dailyquestion: OneQuestionADay,
  memoryquiz: MemoryQuiz,
  truthordare: TruthOrDare,
  completesentence: CompleteSentence,
  rapidfire: RapidFire,
  randomquestion: RandomQuestion,
  scoreboard: Scoreboard,
  moodsync: MoodSync,
  buildourworld: BuildOurWorld,
  askpanda: AskPanda,
};

export interface GameComponentProps {
  uid: string;
  partnerUid: string | null;
  partnerName: string;
  myName: string;
  memory: PandaGameMemory;
  onSendToChat: (data: GameData) => void;
  onComplete: (result: string) => void;
}

export default function GamePanel({ uid, partnerUid, partnerName, myName, onSendToChat, onClose }: GamePanelProps) {
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [memory, setMemory] = useState<PandaGameMemory>({ gameHistory: [], knownFacts: [], streaks: {}, totalPoints: { player1: 0, player2: 0 }, matchRates: {} });

  useEffect(() => {
    getPandaMemory().then(setMemory);
    const unsub = subscribePandaMemory(setMemory);
    return unsub;
  }, []);

  const activeGame = GAMES.find((g) => g.id === activeGameId);
  const ActiveComponent = activeGameId ? GAME_MAP[activeGameId] : null;

  const handleComplete = (result: string) => {
    setActiveGameId(null);
  };

  const p1 = memory.totalPoints?.player1 ?? 0;
  const p2 = memory.totalPoints?.player2 ?? 0;

  if (activeGame && ActiveComponent) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 border-b border-border bg-card/80 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-8 w-8 text-muted-foreground"
            onClick={() => setActiveGameId(null)}
          >
            ←
          </Button>
          <span className="text-lg">{activeGame.emoji}</span>
          <span className="font-semibold text-sm text-foreground">{activeGame.name}</span>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-8 w-8 text-muted-foreground"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <ActiveComponent
            uid={uid}
            partnerUid={partnerUid}
            partnerName={partnerName}
            myName={myName}
            memory={memory}
            onSendToChat={onSendToChat}
            onComplete={handleComplete}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 border-b border-border bg-card/80 backdrop-blur">
        <Gamepad2 className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm text-foreground">Play Together</span>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl h-8 w-8 text-muted-foreground"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {/* Mini scoreboard */}
        <div className="flex items-center justify-between bg-primary/10 rounded-2xl px-4 py-2.5 mb-4">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold text-foreground">{myName.split(" ")[0]}</span>
            <span className="text-sm font-bold text-primary ml-1">{p1}</span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">pts</span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-primary mr-1">{p2}</span>
            <span className="text-xs font-bold text-foreground">{partnerName.split(" ")[0]}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {GAMES.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveGameId(g.id)}
              className={`bg-gradient-to-br ${g.color} border border-border/50 rounded-2xl p-3 text-left hover:scale-[1.03] active:scale-[0.97] transition-transform flex flex-col gap-1 min-h-[80px]`}
            >
              <span className="text-2xl">{g.emoji}</span>
              <span className="text-xs font-bold text-foreground leading-tight">{g.name}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{g.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
