import { Box } from "lucide-react";

export function GlobalLoading() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Box className="w-7 h-7 text-primary-foreground" />
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-primary/30 animate-ping" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground tracking-tight">ExitFlow</h2>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    </div>
  );
}
