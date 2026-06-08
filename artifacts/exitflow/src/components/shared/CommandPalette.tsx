import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import * as Icons from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { NAV_CONFIG } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { useExitStore } from "@/store/exitStore";
import { StatusBadge } from "@/components/shared/StatusBadge";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const cases = useExitStore((s) => s.cases);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setLocation(href);
    },
    [setLocation],
  );

  if (!user) return null;

  const navItems = NAV_CONFIG[user.role] ?? [];
  const myCases =
    user.role === "manager"
      ? cases.filter((c) => c.managerId === user.id)
      : user.role === "employee"
        ? cases.filter((c) => c.employeeId === user.employeeId)
        : cases;

  const pendingTasks = cases.flatMap((c) =>
    c.tasks
      .filter((t) => t.assigneeId === user.id && ["pending", "in_progress", "overdue"].includes(t.status))
      .map((t) => ({ ...t, caseId: c.id, employeeName: c.employeeName })),
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search cases, tasks, pages..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {navItems.map((item) => {
            const Icon = Icons[item.icon as keyof typeof Icons] as React.ElementType;
            return (
              <CommandItem key={`${item.href}-${item.label}`} onSelect={() => navigate(item.href)}>
                <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                {item.label}
              </CommandItem>
            );
          })}
          <CommandItem onSelect={() => navigate("/preferences")}>
            <Icons.Bell className="mr-2 h-4 w-4 text-muted-foreground" />
            Notification Preferences
          </CommandItem>
        </CommandGroup>

        {myCases.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Exit Cases">
              {myCases.slice(0, 8).map((c) => (
                <CommandItem key={c.id} onSelect={() => navigate(`/cases/${c.id}`)}>
                  <Icons.FolderOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{c.employeeName}</span>
                  <span className="text-xs text-muted-foreground font-mono ml-2">{c.id}</span>
                  <StatusBadge status={c.status} className="ml-2 scale-90" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {pendingTasks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="My Pending Tasks">
              {pendingTasks.slice(0, 6).map((t) => (
                <CommandItem key={t.id} onSelect={() => navigate(`/tasks/${t.caseId}__${t.deptId}`)}>
                  <Icons.ClipboardCheck className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate">
                    {t.deptLabel} — {t.employeeName}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {(user.role === "hr" || user.role === "admin") && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Quick Actions">
              <CommandItem onSelect={() => navigate("/cases/new")}>
                <Icons.PlusCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                Create New Exit Case
              </CommandItem>
              <CommandItem onSelect={() => navigate("/reports")}>
                <Icons.BarChart2 className="mr-2 h-4 w-4 text-muted-foreground" />
                View Reports
              </CommandItem>
              <CommandItem onSelect={() => navigate("/reports/audit")}>
                <Icons.ScrollText className="mr-2 h-4 w-4 text-muted-foreground" />
                Audit Trail
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
