interface Props {
  partnerName: string;
}

export function TypingIndicator({ partnerName }: Props) {
  return (
    <div className="flex justify-start px-4 mb-2">
      <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2 shadow-sm">
        <span className="text-xs text-muted-foreground">{partnerName} is typing</span>
        <div className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
