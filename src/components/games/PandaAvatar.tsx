interface PandaAvatarProps {
  thinking?: boolean;
  size?: "sm" | "md" | "lg";
}

export function PandaAvatar({ thinking = false, size = "md" }: PandaAvatarProps) {
  const sz = { sm: "w-8 h-8 text-base", md: "w-12 h-12 text-2xl", lg: "w-16 h-16 text-3xl" }[size];
  return (
    <div className={`${sz} rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 relative`}>
      <span className={thinking ? "animate-pulse" : ""}>🐼</span>
      {thinking && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex gap-0.5">
          {[0, 150, 300].map((d) => (
            <span
              key={d}
              className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PandaBubble({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`flex items-start gap-2.5 bg-primary/10 border-l-4 border-primary rounded-r-2xl p-3 ${className}`}>
      <span className="text-lg flex-shrink-0">🐼</span>
      <p className="text-sm text-foreground leading-relaxed">{text}</p>
    </div>
  );
}

export function PandaThinking({ label = "Panda is thinking…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-6 py-10">
      <PandaAvatar thinking size="lg" />
      <p className="text-sm text-muted-foreground animate-pulse mt-2">{label}</p>
    </div>
  );
}

export function ConfettiBurst({ active }: { active: boolean }) {
  if (!active) return null;
  const pieces = ["🎊", "🎉", "✨", "💕", "🌸", "⭐"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute text-xl animate-bounce"
          style={{
            left: `${15 + i * 14}%`,
            top: `${20 + (i % 3) * 20}%`,
            animationDelay: `${i * 100}ms`,
            animationDuration: "0.8s",
          }}
        >
          {p}
        </span>
      ))}
    </div>
  );
}
