import { TimelineEvent } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { format } from "date-fns";

export function CaseTimeline({ events }: { events: TimelineEvent[] }) {
  const sorted = [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/10 border border-dashed rounded-lg">
        <p className="text-sm font-medium text-slate-300">No activity recorded yet</p>
        <p className="text-xs text-slate-500 mt-1">Timeline events will appear here once the exit process begins.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sorted.map((event, i) => (
        <div key={event.id} className="relative flex gap-4">
          {i !== sorted.length - 1 && (
            <div className="absolute left-4 top-10 bottom-[-24px] w-px bg-border" />
          )}
          
          <div className="relative z-10 shrink-0">
            <UserAvatar name={event.actor} className="w-8 h-8 border-2 border-background ring-2 ring-muted" />
          </div>
          
          <div className="flex-1 pb-1">
            <p className="text-sm font-medium">{event.label}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">{event.actor}</span>
              <span>·</span>
              <span>{event.actorRole.replace('_', ' ')}</span>
              <span>·</span>
              <span>{format(new Date(event.timestamp), "MMM d, h:mm a")}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
