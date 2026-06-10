import { Card, CardContent } from "@/components/ui/card";
import { formatDate, cn } from "@/lib/utils";
import { CheckCircle2, Circle, AlertCircle, Clock, Info } from "lucide-react";
import type { TimelineEvent } from "@/lib/types";

interface EmployeeTimelineProps {
  events: TimelineEvent[];
}

export function EmployeeTimeline({ events }: EmployeeTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
        <Clock className="w-8 h-8 mb-3 opacity-20" />
        <p className="text-sm font-medium">No activity recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const status = event.status || "pending";
        
        return (
          <div key={event.id} className="relative pl-6">
            {!isLast && (
              <div className="absolute left-[11px] top-6 bottom-[-24px] w-px bg-white/10" />
            )}
            
            <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center bg-[#0b0f19]">
              {status === "completed" || status === "approved" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 bg-[#0b0f19]" />
              ) : status === "rejected" ? (
                <AlertCircle className="w-5 h-5 text-red-500 bg-[#0b0f19]" />
              ) : status === "in_progress" ? (
                <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-[#0b0f19]" />
              ) : (
                <Circle className="w-4 h-4 text-slate-500 bg-[#0b0f19]" />
              )}
            </div>

            <Card className="border border-white/5 bg-[#121927] hover:bg-[#161f30] transition-colors rounded-xl shadow-none">
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h4 className="text-sm font-bold text-slate-200 leading-tight">{event.label}</h4>
                  <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">
                    {formatDate(event.timestamp)}
                  </span>
                </div>
                
                {event.message && (
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-xs text-slate-300 leading-relaxed mb-3">
                    {event.message}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-300">
                    {event.actor?.charAt(0) || "U"}
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">
                    {event.actor}
                  </span>
                  <span className="text-[10px] text-slate-600 px-1">•</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    {event.actorRole?.replace('_', ' ')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
