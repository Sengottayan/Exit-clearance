import { format, addHours, isPast } from 'date-fns';
import { ClearanceTask, ExitCase, TaskStatus, DeptId } from './types';
import { DEPARTMENTS, CHECKLIST_TEMPLATES } from './constants';
import { useSettingsStore } from '@/store/settingsStore';

function getDeptConfig(deptId: string) {
  const settings = useSettingsStore.getState();
  return settings.departments.find((d) => d.id === deptId) ?? DEPARTMENTS.find((d) => d.id === deptId);
}

function getChecklistForDept(deptId: string) {
  const settings = useSettingsStore.getState();
  return settings.checklistTemplates[deptId] ?? CHECKLIST_TEMPLATES[deptId] ?? [];
}

export function buildClearanceTasks(
  deptIds: (DeptId | string)[],
  slaStartFrom?: Date,
  slaMultiplier = 1,
): ClearanceTask[] {
  const start = slaStartFrom ?? new Date();
  return deptIds.map((deptId) => {
    const dept = getDeptConfig(deptId);
    if (!dept) throw new Error(`Unknown department: ${deptId}`);

    const slaHours = Math.round(dept.slaHours * slaMultiplier);
    return {
      id: `t-${deptId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      deptId: dept.id,
      deptLabel: dept.label,
      assigneeId: dept.defaultAssignee,
      assigneeName: dept.label,
      status: 'pending' as TaskStatus,
      slaHours,
      slaDueAt: format(addHours(start, slaHours), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
      checklist: [...getChecklistForDept(dept.id)].map((item) => ({ ...item, checked: false })),
    };
  });
}

export function resolveTaskStatus(task: ClearanceTask): TaskStatus {
  if (task.status === 'approved' || task.status === 'rejected') return task.status;
  if (task.slaDueAt && isPast(new Date(task.slaDueAt))) return 'overdue';
  return task.status;
}

export function tryCompleteCase(exitCase: ExitCase): ExitCase {
  if (exitCase.status !== 'in_clearance') return exitCase;

  const settingsDepts = useSettingsStore.getState().departments;
  const mandatoryDeptIds = new Set(settingsDepts.filter((d) => d.isMandatory).map((d) => d.id));
  const mandatoryTasks = exitCase.tasks.filter((t) => mandatoryDeptIds.has(t.deptId));
  if (mandatoryTasks.length === 0) return exitCase;

  const allApproved = mandatoryTasks.every((t) => t.status === 'approved');
  if (!allApproved) return exitCase;

  return {
    ...exitCase,
    status: 'completed',
    timeline: [
      {
        id: `evt-${Date.now()}`,
        label: 'Clearance completed',
        timestamp: new Date().toISOString(),
        actor: 'System',
        actorRole: 'system',
      },
      ...exitCase.timeline,
    ],
  };
}

export function getManagerForEmployee(employeeDept: string): { id: string; name: string } {
  return { id: '', name: 'Loading...' };
}

export function normalizeCaseTasks(
  tasks: ClearanceTask[],
  fallbackDeptIds?: (DeptId | string)[],
): ClearanceTask[] {
  const hasChecklists = tasks.length > 0 && tasks.every((t) => t.checklist.length > 0);
  if (hasChecklists) return tasks;

  const deptIds = tasks.length > 0 ? tasks.map((t) => t.deptId) : (fallbackDeptIds ?? DEPARTMENTS.map((d) => d.id));
  return buildClearanceTasks(deptIds);
}
