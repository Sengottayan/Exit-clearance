import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ExitCase, TaskStatus, ChecklistItem, ExitInterview, CaseComment } from '@/lib/types';
import { differenceInDays } from 'date-fns';
import { DEPARTMENTS } from '@/lib/constants';
import { addHours, format } from 'date-fns';
import { buildClearanceTasks, normalizeCaseTasks, tryCompleteCase } from '@/lib/workflow';
import { useNotificationStore } from '@/store/notificationStore';

interface ExitStore {
  cases: ExitCase[];
  addCase: (newCase: Omit<ExitCase, 'id'>) => void;
  updateCaseStatus: (caseId: string, status: ExitCase['status']) => void;
  checkItem: (caseId: string, deptId: string, itemId: string, checked: boolean) => void;
  setItemInput: (caseId: string, deptId: string, itemId: string, inputValue: string) => void;
  approveTask: (caseId: string, deptId: string, notes?: string) => void;
  rejectTask: (caseId: string, deptId: string, reason: string) => void;
  saveTaskDraft: (caseId: string, deptId: string, checklist: ChecklistItem[]) => void;
  generateDocument: (caseId: string, docType: 'relievingLetter' | 'experienceCertificate') => void;
  saveExitInterview: (caseId: string, interview: ExitInterview) => void;
  approveResignation: (caseId: string, actor: string) => void;
  uploadDocument: (caseId: string, docType: 'resignationLetter', fileName: string) => void;
  uploadAttachment: (caseId: string, fileName: string, actor: string) => void;
  cancelCase: (caseId: string, reason: string, actor: string) => void;
  extendLastWorkingDay: (caseId: string, newDate: string, actor: string) => void;
  escalateCase: (caseId: string, reason: string, actor: string) => void;
  addComment: (caseId: string, comment: Omit<CaseComment, 'id' | 'timestamp'>) => void;
}

const SEED_CASES: ExitCase[] = [
  {
    id: 'CASE-2024-001',
    employeeId: 'EMP-1001',
    employeeName: 'Arjun Nair',
    employeeEmail: 'arjun@company.com',
    employeeRole: 'Sr. Developer',
    employeeDept: 'Engineering',
    managerId: 'u2',
    managerName: 'Rahul Mehta',
    status: 'in_clearance',
    resignationDate: '2025-01-01T00:00:00.000Z',
    lastWorkingDay: '2025-01-15T00:00:00.000Z',
    noticePeriodDays: 14,
    exitReason: 'better_opportunity',
    tasks: buildClearanceTasks(DEPARTMENTS.map((d) => d.id), new Date('2025-01-01')).map((task) => {
      let status: TaskStatus = 'pending';
      let slaDueAt = task.slaDueAt;
      let items = [...task.checklist];

      if (task.deptId === 'manager') {
        status = 'approved';
        items = items.map((i) => ({ ...i, checked: true }));
      } else if (task.deptId === 'it') {
        status = 'overdue';
        slaDueAt = '2025-01-03T00:00:00.000Z';
        if (items.length > 0) {
          items[0] = { ...items[0], checked: true, inputValue: 'LAP-2024-001' };
          if (items.length > 2) items[2] = { ...items[2], checked: true };
          if (items.length > 3) items[3] = { ...items[3], checked: true };
        }
      } else if (task.deptId === 'admin') {
        status = 'approved';
        items = items.map((i) => ({ ...i, checked: true }));
      } else if (task.deptId === 'finance') {
        status = 'in_progress';
        if (items.length > 0) items[0] = { ...items[0], checked: true };
        if (items.length > 1) items[1] = { ...items[1], checked: true };
      } else if (task.deptId === 'procurement' || task.deptId === 'infosec') {
        status = 'approved';
        items = items.map((i) => ({ ...i, checked: true }));
      }

      return { ...task, id: `t-${task.deptId}-001`, status, slaDueAt, checklist: items };
    }),
    timeline: [
      { id: 'ev-1', label: 'Resignation submitted', timestamp: '2025-01-01T10:00:00.000Z', actor: 'Arjun Nair', actorRole: 'employee' },
      { id: 'ev-2', label: 'Manager approved', timestamp: '2025-01-02T11:00:00.000Z', actor: 'Rahul Mehta', actorRole: 'manager' },
      { id: 'ev-3', label: 'IT clearance started', timestamp: '2025-01-02T12:00:00.000Z', actor: 'Kiran Patel', actorRole: 'dept_approver' },
      { id: 'ev-4', label: 'Admin clearance approved', timestamp: '2025-01-03T10:00:00.000Z', actor: 'Admin Dept', actorRole: 'dept_approver' },
      { id: 'ev-5', label: 'Procurement clearance approved', timestamp: '2025-01-04T10:00:00.000Z', actor: 'Procurement', actorRole: 'dept_approver' },
      { id: 'ev-6', label: 'InfoSec clearance approved', timestamp: '2025-01-05T10:00:00.000Z', actor: 'InfoSec', actorRole: 'dept_approver' },
    ],
    documents: {},
  },
  {
    id: 'CASE-2024-002',
    employeeId: 'EMP-1002',
    employeeName: 'Meera Krishnan',
    employeeEmail: 'meera@company.com',
    employeeRole: 'QA Engineer',
    employeeDept: 'Testing',
    managerId: 'u2',
    managerName: 'Rahul Mehta',
    status: 'pending_manager',
    resignationDate: '2025-01-05T00:00:00.000Z',
    lastWorkingDay: '2025-01-30T00:00:00.000Z',
    noticePeriodDays: 25,
    exitReason: 'compensation',
    tasks: buildClearanceTasks(DEPARTMENTS.map((d) => d.id)).map((task) => ({
      ...task,
      id: `t-${task.deptId}-002`,
    })),
    timeline: [
      { id: 'ev-2-1', label: 'Resignation submitted', timestamp: '2025-01-05T09:00:00.000Z', actor: 'Meera Krishnan', actorRole: 'employee' },
    ],
    documents: {},
  },
  {
    id: 'CASE-2024-003',
    employeeId: 'EMP-1003',
    employeeName: 'Dev Anand',
    employeeEmail: 'dev@company.com',
    employeeRole: 'Product Manager',
    employeeDept: 'Product',
    managerId: 'u11',
    managerName: 'Sunita Iyer',
    status: 'completed',
    resignationDate: '2024-11-01T00:00:00.000Z',
    lastWorkingDay: '2024-11-30T00:00:00.000Z',
    noticePeriodDays: 29,
    exitReason: 'higher_studies',
    tasks: buildClearanceTasks(DEPARTMENTS.map((d) => d.id), new Date('2024-11-01')).map((task) => ({
      ...task,
      id: `t-${task.deptId}-003`,
      status: 'approved' as TaskStatus,
      slaDueAt: '2024-11-05T00:00:00.000Z',
      checklist: task.checklist.map((i) => ({ ...i, checked: true })),
    })),
    timeline: [
      { id: 'ev-3-1', label: 'Resignation submitted', timestamp: '2024-11-01T09:00:00.000Z', actor: 'Dev Anand', actorRole: 'employee' },
      { id: 'ev-3-2', label: 'Manager approved', timestamp: '2024-11-02T10:00:00.000Z', actor: 'Sunita Iyer', actorRole: 'manager' },
      { id: 'ev-3-last', label: 'Clearance completed', timestamp: '2024-11-20T10:00:00.000Z', actor: 'System', actorRole: 'system' },
    ],
    exitInterview: {
      overallRating: 4,
      managementRating: 4,
      cultureRating: 5,
      reason: 'Pursuing masters',
      improvements: 'More training budgets',
      wouldRejoin: true,
      comments: 'Great place to work!',
      completedAt: '2024-11-15T10:00:00.000Z',
    },
    documents: {
      relievingLetter: 'relieving-CASE-2024-003.pdf',
      experienceCertificate: 'experience-CASE-2024-003.pdf',
    },
  },
  {
    id: 'CASE-2024-004',
    employeeId: 'EMP-1042',
    employeeName: 'Priya Sharma',
    employeeEmail: 'priya@company.com',
    employeeRole: 'Employee',
    employeeDept: 'Engineering',
    managerId: 'u2',
    managerName: 'Rahul Mehta',
    status: 'in_clearance',
    resignationDate: '2025-01-10T00:00:00.000Z',
    lastWorkingDay: '2025-02-10T00:00:00.000Z',
    noticePeriodDays: 31,
    exitReason: 'personal',
    tasks: buildClearanceTasks(DEPARTMENTS.map((d) => d.id), new Date('2025-01-12')).map((task) => {
      let status: TaskStatus = 'pending';
      let items = [...task.checklist];
      if (task.deptId === 'manager') {
        status = 'approved';
        items = items.map((i) => ({ ...i, checked: true }));
      }
      return { ...task, id: `t-${task.deptId}-004`, status, checklist: items };
    }),
    timeline: [
      { id: 'ev-4-1', label: 'Resignation submitted', timestamp: '2025-01-10T09:00:00.000Z', actor: 'Priya Sharma', actorRole: 'employee' },
      { id: 'ev-4-2', label: 'Manager approved', timestamp: '2025-01-12T10:00:00.000Z', actor: 'Rahul Mehta', actorRole: 'manager' },
    ],
    documents: {
      resignationLetter: 'resignation-CASE-2024-004.pdf',
    },
  },
];

function notify(notification: Parameters<ReturnType<typeof useNotificationStore.getState>['addNotification']>[0]) {
  useNotificationStore.getState().addNotification(notification);
}

export const useExitStore = create<ExitStore>()(
  persist(
    (set) => ({
      cases: SEED_CASES,

      addCase: (newCase) =>
        set((state) => {
          const id = `CASE-${new Date().getFullYear()}-${String(state.cases.length + 1).padStart(3, '0')}`;
          const tasks = normalizeCaseTasks(newCase.tasks);
          const caseData: ExitCase = {
            ...newCase,
            id,
            tasks,
            documents: newCase.documents ?? {},
            comments: newCase.comments ?? [],
          };

          notify({
            userId: newCase.managerId,
            type: 'approval',
            title: 'Resignation awaiting approval',
            message: `${newCase.employeeName} has submitted a resignation request.`,
            href: `/cases/${id}`,
          });

          return { cases: [caseData, ...state.cases] };
        }),

      updateCaseStatus: (caseId, status) =>
        set((state) => ({
          cases: state.cases.map((c) => (c.id === caseId ? { ...c, status } : c)),
        })),

      checkItem: (caseId, deptId, itemId, checked) =>
        set((state) => ({
          cases: state.cases.map((c) => {
            if (c.id !== caseId) return c;
            const tasks = c.tasks.map((t) => {
              if (t.deptId !== deptId) return t;
              const checklist = t.checklist.map((item) => (item.id === itemId ? { ...item, checked } : item));
              return { ...t, checklist, status: t.status === 'pending' ? 'in_progress' : t.status };
            });
            return { ...c, tasks };
          }),
        })),

      setItemInput: (caseId, deptId, itemId, inputValue) =>
        set((state) => ({
          cases: state.cases.map((c) => {
            if (c.id !== caseId) return c;
            const tasks = c.tasks.map((t) => {
              if (t.deptId !== deptId) return t;
              const checklist = t.checklist.map((item) => (item.id === itemId ? { ...item, inputValue } : item));
              return { ...t, checklist };
            });
            return { ...c, tasks };
          }),
        })),

      approveTask: (caseId, deptId, notes) =>
        set((state) => ({
          cases: state.cases.map((c) => {
            if (c.id !== caseId) return c;
            const tasks = c.tasks.map((t) => {
              if (t.deptId !== deptId) return t;
              return { ...t, status: 'approved' as TaskStatus, completedAt: new Date().toISOString(), notes };
            });
            const deptLabel = DEPARTMENTS.find((d) => d.id === deptId)?.label ?? deptId;
            let updated: ExitCase = {
              ...c,
              tasks,
              timeline: [
                {
                  id: `evt-${Date.now()}`,
                  label: `${deptLabel} clearance approved`,
                  timestamp: new Date().toISOString(),
                  actor: 'Approver',
                  actorRole: 'dept_approver',
                },
                ...c.timeline,
              ],
            };
            updated = tryCompleteCase(updated);

            notify({
              userId: c.managerId,
              type: 'system',
              title: `${deptLabel} clearance approved`,
              message: `Clearance for ${c.employeeName} was approved.`,
              href: `/cases/${caseId}`,
            });

            if (updated.status === 'completed') {
              notify({
                userId: 'u3',
                type: 'completion',
                title: 'Exit clearance completed',
                message: `${c.employeeName}'s exit process is now complete.`,
                href: `/cases/${caseId}`,
              });
            }

            return updated;
          }),
        })),

      rejectTask: (caseId, deptId, reason) =>
        set((state) => ({
          cases: state.cases.map((c) => {
            if (c.id !== caseId) return c;
            const tasks = c.tasks.map((t) => {
              if (t.deptId !== deptId) return t;
              return { ...t, status: 'rejected' as TaskStatus, rejectionReason: reason };
            });
            const deptLabel = DEPARTMENTS.find((d) => d.id === deptId)?.label ?? deptId;

            notify({
              userId: c.managerId,
              type: 'rejection',
              title: `${deptLabel} clearance rejected`,
              message: `Clearance for ${c.employeeName} was rejected: ${reason}`,
              href: `/cases/${caseId}`,
            });
            notify({
              userId: 'u3',
              type: 'rejection',
              title: `${deptLabel} clearance rejected`,
              message: `${c.employeeName}'s clearance needs attention.`,
              href: `/cases/${caseId}`,
            });

            return {
              ...c,
              tasks,
              timeline: [
                {
                  id: `evt-${Date.now()}`,
                  label: `${deptLabel} clearance rejected`,
                  timestamp: new Date().toISOString(),
                  actor: 'Approver',
                  actorRole: 'dept_approver',
                },
                ...c.timeline,
              ],
            };
          }),
        })),

      saveTaskDraft: (caseId, deptId, checklist) =>
        set((state) => ({
          cases: state.cases.map((c) => {
            if (c.id !== caseId) return c;
            const tasks = c.tasks.map((t) => {
              if (t.deptId !== deptId) return t;
              return { ...t, checklist, status: 'in_progress' as TaskStatus };
            });
            return { ...c, tasks };
          }),
        })),

      generateDocument: (caseId, docType) =>
        set((state) => ({
          cases: state.cases.map((c) => {
            if (c.id !== caseId) return c;
            const docName = `${docType === 'relievingLetter' ? 'relieving' : 'experience'}-${c.id}.pdf`;
            return {
              ...c,
              documents: { ...c.documents, [docType]: docName },
              timeline: [
                {
                  id: `evt-${Date.now()}`,
                  label: `${docType === 'relievingLetter' ? 'Relieving Letter' : 'Experience Certificate'} generated`,
                  timestamp: new Date().toISOString(),
                  actor: 'HR',
                  actorRole: 'hr',
                },
                ...c.timeline,
              ],
            };
          }),
        })),

      saveExitInterview: (caseId, interview) =>
        set((state) => ({
          cases: state.cases.map((c) =>
            c.id === caseId ? { ...c, exitInterview: { ...interview, completedAt: new Date().toISOString() } } : c,
          ),
        })),

      approveResignation: (caseId, actor) =>
        set((state) => ({
          cases: state.cases.map((c) => {
            if (c.id !== caseId) return c;
            const now = new Date();
            const tasks = c.tasks.map((t) => ({
              ...t,
              slaDueAt: format(addHours(now, t.slaHours), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
              status: (t.deptId === 'manager' ? 'approved' : 'pending') as TaskStatus,
              completedAt: t.deptId === 'manager' ? now.toISOString() : undefined,
            }));

            c.tasks.forEach((t) => {
              if (t.deptId !== 'manager') {
                notify({
                  userId: t.assigneeId,
                  type: 'approval',
                  title: 'New clearance task assigned',
                  message: `Clearance for ${c.employeeName} (${t.deptLabel}) is ready for review.`,
                  href: `/tasks/${caseId}__${t.deptId}`,
                });
              }
            });

            return {
              ...c,
              status: 'in_clearance',
              tasks,
              timeline: [
                {
                  id: `evt-${Date.now()}`,
                  label: 'Manager approved resignation',
                  timestamp: now.toISOString(),
                  actor,
                  actorRole: 'manager',
                },
                ...c.timeline,
              ],
            };
          }),
        })),

      uploadDocument: (caseId, docType, fileName) =>
        set((state) => ({
          cases: state.cases.map((c) => {
            if (c.id !== caseId) return c;
            return {
              ...c,
              documents: { ...c.documents, [docType]: fileName },
              timeline: [
                {
                  id: `evt-${Date.now()}`,
                  label: `${docType === 'resignationLetter' ? 'Resignation letter' : docType} uploaded`,
                  timestamp: new Date().toISOString(),
                  actor: 'Employee',
                  actorRole: 'employee',
                },
                ...c.timeline,
              ],
            };
          }),
        })),

      uploadAttachment: (caseId, fileName, actor) =>
        set((state) => ({
          cases: state.cases.map((c) => {
            if (c.id !== caseId) return c;
            const attachment = {
              id: `att-${Date.now()}`,
              name: fileName,
              uploadedAt: new Date().toISOString(),
              uploadedBy: actor,
            };
            return {
              ...c,
              documents: {
                ...c.documents,
                attachments: [attachment, ...(c.documents.attachments ?? [])],
              },
              timeline: [
                {
                  id: `evt-${Date.now()}`,
                  label: `Attachment uploaded: ${fileName}`,
                  timestamp: new Date().toISOString(),
                  actor,
                  actorRole: 'system',
                },
                ...c.timeline,
              ],
            };
          }),
        })),

      cancelCase: (caseId, reason, actor) =>
        set((state) => ({
          cases: state.cases.map((c) => {
            if (c.id !== caseId) return c;
            notify({
              userId: c.managerId,
              type: 'system',
              title: 'Exit case cancelled',
              message: `${c.employeeName}'s exit process was cancelled.`,
              href: `/cases/${caseId}`,
            });
            return {
              ...c,
              status: 'cancelled',
              cancelReason: reason,
              timeline: [
                {
                  id: `evt-${Date.now()}`,
                  label: `Case cancelled: ${reason}`,
                  timestamp: new Date().toISOString(),
                  actor,
                  actorRole: 'hr',
                },
                ...c.timeline,
              ],
            };
          }),
        })),

      extendLastWorkingDay: (caseId, newDate, actor) =>
        set((state) => ({
          cases: state.cases.map((c) => {
            if (c.id !== caseId) return c;
            const noticePeriodDays = differenceInDays(new Date(newDate), new Date(c.resignationDate));
            notify({
              userId: c.managerId,
              type: 'system',
              title: 'Last working day updated',
              message: `${c.employeeName}'s LWD has been extended.`,
              href: `/cases/${caseId}`,
            });
            return {
              ...c,
              lastWorkingDay: newDate,
              noticePeriodDays,
              timeline: [
                {
                  id: `evt-${Date.now()}`,
                  label: `Last working day extended to ${format(new Date(newDate), 'MMM d, yyyy')}`,
                  timestamp: new Date().toISOString(),
                  actor,
                  actorRole: 'hr',
                },
                ...c.timeline,
              ],
            };
          }),
        })),

      escalateCase: (caseId, reason, actor) =>
        set((state) => ({
          cases: state.cases.map((c) => {
            if (c.id !== caseId) return c;
            notify({
              userId: 'u3',
              type: 'sla',
              title: 'Case escalated to HR',
              message: `${c.employeeName}'s exit case needs attention: ${reason}`,
              href: `/cases/${caseId}`,
            });
            return {
              ...c,
              escalated: true,
              timeline: [
                {
                  id: `evt-${Date.now()}`,
                  label: `Escalated to HR: ${reason}`,
                  timestamp: new Date().toISOString(),
                  actor,
                  actorRole: 'manager',
                },
                ...c.timeline,
              ],
            };
          }),
        })),

      addComment: (caseId, comment) =>
        set((state) => ({
          cases: state.cases.map((c) => {
            if (c.id !== caseId) return c;
            const newComment: CaseComment = {
              ...comment,
              id: `cmt-${Date.now()}`,
              timestamp: new Date().toISOString(),
            };
            return {
              ...c,
              comments: [...(c.comments ?? []), newComment],
            };
          }),
        })),
    }),
    {
      name: 'exitflow-cases',
      partialize: (state) => ({ cases: state.cases }),
    },
  ),
);
