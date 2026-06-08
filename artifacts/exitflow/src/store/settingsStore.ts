import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Department, DeptId, ChecklistTemplate } from '@/lib/types';
import { DEPARTMENTS, CHECKLIST_TEMPLATES } from '@/lib/constants';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  deptIds: DeptId[];
  slaMultiplier?: number;
}

interface WorkflowSettings {
  slaWarningHours: number;
  escalationHours: number;
  deptOrder: DeptId[];
  defaultTemplateId: string;
}

interface SettingsState {
  departments: Department[];
  workflow: WorkflowSettings;
  checklistTemplates: Record<string, ChecklistTemplate[]>;
  workflowTemplates: WorkflowTemplate[];
  updateDepartment: (id: DeptId, updates: Partial<Department>) => void;
  updateWorkflow: (updates: Partial<WorkflowSettings>) => void;
  resetDepartments: () => void;
  updateChecklistForDept: (deptId: string, items: ChecklistTemplate[]) => void;
  addChecklistItem: (deptId: string, item: ChecklistTemplate) => void;
  removeChecklistItem: (deptId: string, itemId: string) => void;
  updateWorkflowTemplate: (id: string, updates: Partial<WorkflowTemplate>) => void;
}

export const DEFAULT_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'standard',
    name: 'Standard Exit',
    description: 'Full clearance for permanent employees across all mandatory departments.',
    deptIds: DEPARTMENTS.map((d) => d.id),
  },
  {
    id: 'contractor',
    name: 'Contractor Exit',
    description: 'Streamlined clearance — Manager, IT, Admin, and HR only.',
    deptIds: ['manager', 'it', 'admin', 'hr'],
  },
  {
    id: 'executive',
    name: 'Executive Exit',
    description: 'Full clearance with extended SLA windows for senior departures.',
    deptIds: DEPARTMENTS.map((d) => d.id),
    slaMultiplier: 1.5,
  },
];

const defaultWorkflow: WorkflowSettings = {
  slaWarningHours: 24,
  escalationHours: 48,
  deptOrder: DEPARTMENTS.map((d) => d.id),
  defaultTemplateId: 'standard',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      departments: DEPARTMENTS,
      workflow: defaultWorkflow,
      checklistTemplates: { ...CHECKLIST_TEMPLATES },
      workflowTemplates: DEFAULT_WORKFLOW_TEMPLATES,

      updateDepartment: (id, updates) =>
        set((state) => ({
          departments: state.departments.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        })),

      updateWorkflow: (updates) =>
        set((state) => ({
          workflow: { ...state.workflow, ...updates },
        })),

      resetDepartments: () => set({ departments: DEPARTMENTS }),

      updateChecklistForDept: (deptId, items) =>
        set((state) => ({
          checklistTemplates: { ...state.checklistTemplates, [deptId]: items },
        })),

      addChecklistItem: (deptId, item) =>
        set((state) => ({
          checklistTemplates: {
            ...state.checklistTemplates,
            [deptId]: [...(state.checklistTemplates[deptId] ?? []), item],
          },
        })),

      removeChecklistItem: (deptId, itemId) =>
        set((state) => ({
          checklistTemplates: {
            ...state.checklistTemplates,
            [deptId]: (state.checklistTemplates[deptId] ?? []).filter((i) => i.id !== itemId),
          },
        })),

      updateWorkflowTemplate: (id, updates) =>
        set((state) => ({
          workflowTemplates: state.workflowTemplates.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
    }),
    { name: 'exitflow-settings' },
  ),
);

export function getWorkflowTemplate(id: string): WorkflowTemplate | undefined {
  return useSettingsStore.getState().workflowTemplates.find((t) => t.id === id);
}
