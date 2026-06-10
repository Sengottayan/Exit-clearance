import { useAuth } from "@/hooks/useAuth";
import { useCases } from "@/hooks/api/useCases";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, cn } from "@/lib/utils";
import { Bell, CheckCircle2, Circle, AlertCircle, Inbox } from "lucide-react";
import { Redirect } from "@/lib/wouter";
import type { TimelineEvent } from "@/lib/types";

export default function NotificationsPage() {
  const { user, isEmployee } = useAuth();
  const { data: cases, isLoading } = useCases();

  if (!isEmployee) return <Redirect to="/dashboard" />;

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Aggregate all timeline events for the employee's cases
  let allEvents: TimelineEvent[] = [];
  if (cases) {
    cases.forEach(c => {
      if (c.timeline) {
        allEvents = [...allEvents, ...c.timeline];
      }
    });
  }

  // Sort events newest first
  allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <PageHeader
        title="Notifications"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Notifications" }]}
      />

      <div className="bg-[#121927] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-white/5 bg-[#161f30]/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Recent Activity</h2>
              <p className="text-xs text-slate-400">Updates regarding your exit clearance process</p>
            </div>
          </div>
          <div className="bg-[#1e2a4f] text-[#8ab4f8] text-xs font-bold px-3 py-1 rounded-full border border-[#3b5998]/50">
            {allEvents.length} Events
          </div>
        </div>

        <div className="p-0">
          {allEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Inbox className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-slate-300 font-bold mb-1">No notifications yet</h3>
              <p className="text-slate-500 text-sm">When your manager or departments update your clearance, it will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {allEvents.map((event) => {
                const status = event.status || "pending";
                return (
                  <div key={event.id} className="p-5 hover:bg-white/[0.02] transition-colors flex gap-4">
                    <div className="shrink-0 mt-1">
                      {status === "completed" || status === "approved" ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                      ) : status === "rejected" ? (
                        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        </div>
                      ) : status === "in_progress" ? (
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                          <Circle className="w-4 h-4 text-slate-500" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-1">
                        <p className="text-sm font-bold text-slate-200 truncate">{event.label}</p>
                        <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">
                          {formatDate(event.timestamp)}
                        </span>
                      </div>
                      
                      {event.message && (
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed bg-[#0b0f19] p-3 rounded-lg border border-white/5">
                          {event.message}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-[10px] font-semibold text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                          {event.actor}
                        </span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">
                          {event.actorRole?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
