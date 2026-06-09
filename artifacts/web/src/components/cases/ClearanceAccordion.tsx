import { ExitCase } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SLARiskChip } from "@/components/shared/SLARiskChip";
import { CheckCircle2, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";

export function ClearanceAccordion({ exitCase }: { exitCase: ExitCase }) {
  const tasks = exitCase?.tasks || [];
  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/10 border border-dashed rounded-lg">
        <p className="text-sm font-medium text-slate-300">No workflow tasks assigned</p>
        <p className="text-xs text-slate-500 mt-1">Department clearance tasks will appear here.</p>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-white/5 bg-[#121927]">
      <Accordion type="multiple" className="w-full">
        {tasks.map(task => (
          <AccordionItem value={task.id} key={task.id} className="border-b last:border-0">
            <AccordionTrigger className="hover:no-underline hover:bg-muted/30 px-6 py-4">
              <div className="flex flex-1 items-center justify-between pr-4">
                <div className="flex items-center gap-4">
                  {task.status === 'approved' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div className="text-left">
                    <p className="font-medium text-sm">{task.deptLabel}</p>
                    <p className="text-xs text-muted-foreground font-normal mt-0.5">Assigned to: {task.assigneeName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {!['approved', 'rejected'].includes(task.status) && (
                    <SLARiskChip dueAt={task.slaDueAt} className="hidden sm:flex" />
                  )}
                  <StatusBadge status={task.status} />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2 bg-muted/5">
              <div className="space-y-4">
                {task.checklist.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No checklist items.</p>
                ) : (
                  <div className="grid gap-3">
                    {task.checklist.map(item => (
                      <div key={item.id} className="flex items-start gap-3 p-3 rounded bg-card border text-sm">
                        {item.checked ? (
                          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className={item.checked ? "text-muted-foreground line-through" : "font-medium"}>
                            {item.label}
                            {item.isMandatory && <span className="ml-2 text-[10px] uppercase text-muted-foreground font-semibold bg-secondary px-1 py-0.5 rounded">Required</span>}
                          </p>
                          {item.hasInput && item.checked && item.inputValue && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.inputLabel}: <span className="font-medium text-foreground">{item.inputValue}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {task.notes && (
                  <div className="mt-4 p-3 bg-muted rounded text-sm">
                    <p className="font-semibold text-xs mb-1">Notes from approver:</p>
                    <p>{task.notes}</p>
                  </div>
                )}
                {task.rejectionReason && (
                  <div className="mt-4 p-3 bg-red-50 text-red-900 border border-red-200 rounded text-sm dark:bg-red-500/10 dark:text-red-400 dark:border-red-900">
                    <p className="font-semibold text-xs mb-1">Rejection Reason:</p>
                    <p>{task.rejectionReason}</p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  );
}
