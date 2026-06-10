import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ExitCase, TaskStatus, ChecklistItem, ExitInterview, CaseComment } from '@/lib/types';
import { differenceInCalendarDays } from 'date-fns';
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

const SEED_CASES: ExitCase[] = [];

function notify(notification: Parameters<ReturnType<typeof useNotificationStore.getState>['addNotification']>[0]) {
  useNotificationStore.getState().addNotification(notification);
}

export const useExitStore = create<ExitStore>()(
  persist(
    (set) => ({
      cases: SEED_CASES,

      addCase: (newCase) =>
        set((state) => {
          // Preserve the API-assigned ID if present; otherwise generate one
          const id = (newCase as ExitCase).id || `CASE-${new Date().getFullYear()}-${String(state.cases.length + 1).padStart(3, '0')}`;
          // Deduplicate: if the ID already exists in the store, skip
          if (state.cases.some((c) => c.id === id)) return state;
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
            const noticePeriodDays = differenceInCalendarDays(new Date(newDate), new Date(c.resignationDate));
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
