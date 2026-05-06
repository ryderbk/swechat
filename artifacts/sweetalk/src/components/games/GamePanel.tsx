import { useState, useEffect } from "react";
import { X, Trophy, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GameData } from "@/lib/firestore";
import type { PandaGameMemory } from "@/lib/panda";
import { getPandaMemory, subscribePandaMemory, updatePandaMemory } from "@/lib/gameFirestore";

import { TruthOrDare } from "./TruthOrDare";

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
  { id: "truthordare",      name: "Truth or Dare",        emoji: "🎭", desc: "Bold or honest?",          color: "from-pink-400/20 to-rose-300/20" },
];

const GAME_MAP: Record<string, React.ComponentType<GameComponentProps>> = {
  truthordare: TruthOrDare,
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
  const [memory, setMemory] = useState<PandaGameMemory>({ 
    gameHistory: [], knownFacts: [], streaks: {}, 
    totalPoints: { player1: 0, player2: 0 }, matchRates: {},
    activeGameId: null, activeGameDocId: null 
  });

  useEffect(() => {
    getPandaMemory().then(setMemory);
    const unsub = subscribePandaMemory(setMemory);
    return unsub;
  }, []);

  const activeGameId = memory.activeGameId;
  const activeGame = GAMES.find((g) => g.id === activeGameId);
  const ActiveComponent = activeGameId ? GAME_MAP[activeGameId] : null;

  const handleSelectGame = (gameId: string) => {
    updatePandaMemory({ activeGameId: gameId, activeGameDocId: null })
      .catch(err => {
        console.error("Failed to start game:", err);
        alert("Game sync failed! Please check your Firestore rules.");
      });
  };

  const handleCloseGame = () => {
    updatePandaMemory({ activeGameId: null, activeGameDocId: null })
      .catch(console.error);
  };

  const handleComplete = (result: string) => {
    handleCloseGame();
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
            onClick={handleCloseGame}
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

        <div className="grid grid-cols-1 gap-2">
          {GAMES.map((g) => (
            <button
              key={g.id}
              onClick={() => handleSelectGame(g.id)}
              className={`bg-gradient-to-br ${g.color} border border-border/50 rounded-2xl p-4 text-left hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-4 min-h-[100px]`}
            >
              <span className="text-4xl">{g.emoji}</span>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-foreground leading-tight">{g.name}</span>
                <span className="text-xs text-muted-foreground leading-tight">{g.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
