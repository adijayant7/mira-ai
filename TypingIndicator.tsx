export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">
        M
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot-1" />
        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot-2" />
        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot-3" />
      </div>
    </div>
  );
}
