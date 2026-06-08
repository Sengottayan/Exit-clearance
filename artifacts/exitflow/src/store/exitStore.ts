import { create } from 'zustand';
import { ExitCase, TaskStatus, ChecklistItem, ExitInterview } from '@/lib/types';
import { DEPARTMENTS, CHECKLIST_TEMPLATES } from '@/lib/constants';
import { addDays, addHours, format } from 'date-fns';

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
}

const generateMockTimeline = () => {
  return [
    {
      id: `evt-${Date.now()}-1`,
      label: 'Resignation submitted',
      timestamp: new Date().toISOString(),
      actor: 'Employee',
      actorRole: 'employee'
    }
  ];
};

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
    tasks: DEPARTMENTS.map(dept => {
      let status: TaskStatus = 'pending';
      let slaDueAt = format(addDays(new Date('2025-01-01'), 2), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
      let checkedItems = 0;
      let items = [...(CHECKLIST_TEMPLATES[dept.id] || [])].map(item => ({ ...item, checked: false }));

      if (dept.id === 'manager') { status = 'approved'; checkedItems = items.length; items.forEach(i => i.checked = true); }
      else if (dept.id === 'it') { 
        status = 'overdue'; 
        slaDueAt = '2025-01-03T00:00:00.000Z';
        if (items.length > 0) {
          items[0].checked = true;
          items[0].inputValue = "LAP-2024-001";
          if (items.length > 2) items[2].checked = true;
          if (items.length > 3) items[3].checked = true;
        }
      }
      else if (dept.id === 'admin') { status = 'approved'; items.forEach(i => i.checked = true); }
      else if (dept.id === 'finance') {
        status = 'in_progress';
        if (items.length > 0) items[0].checked = true;
        if (items.length > 1) items[1].checked = true;
      }
      else if (dept.id === 'procurement') { status = 'approved'; items.forEach(i => i.checked = true); }
      else if (dept.id === 'infosec') { status = 'approved'; items.forEach(i => i.checked = true); }

      return {
        id: `t-${dept.id}-001`,
        deptId: dept.id,
        deptLabel: dept.label,
        assigneeId: dept.defaultAssignee,
        assigneeName: dept.label, 
        status,
        slaHours: dept.slaHours,
        slaDueAt,
        checklist: items,
      };
    }),
    timeline: [
      { id: 'ev-1', label: 'Resignation submitted', timestamp: '2025-01-01T10:00:00.000Z', actor: 'Arjun Nair', actorRole: 'employee' },
      { id: 'ev-2', label: 'Manager approved', timestamp: '2025-01-02T11:00:00.000Z', actor: 'Rahul Mehta', actorRole: 'manager' },
      { id: 'ev-3', label: 'IT clearance started', timestamp: '2025-01-02T12:00:00.000Z', actor: 'Kiran Patel', actorRole: 'dept_approver' },
      { id: 'ev-4', label: 'Admin clearance approved', timestamp: '2025-01-03T10:00:00.000Z', actor: 'Admin Dept', actorRole: 'dept_approver' },
      { id: 'ev-5', label: 'Procurement clearance approved', timestamp: '2025-01-04T10:00:00.000Z', actor: 'Procurement', actorRole: 'dept_approver' },
      { id: 'ev-6', label: 'InfoSec clearance approved', timestamp: '2025-01-05T10:00:00.000Z', actor: 'InfoSec', actorRole: 'dept_approver' },
    ],
    documents: {}
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
    tasks: DEPARTMENTS.map(dept => ({
      id: `t-${dept.id}-002`,
      deptId: dept.id,
      deptLabel: dept.label,
      assigneeId: dept.defaultAssignee,
      assigneeName: dept.label,
      status: 'pending',
      slaHours: dept.slaHours,
      slaDueAt: format(addHours(new Date(), dept.slaHours), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
      checklist: [...(CHECKLIST_TEMPLATES[dept.id] || [])].map(item => ({ ...item, checked: false })),
    })),
    timeline: [
      { id: 'ev-2-1', label: 'Resignation submitted', timestamp: '2025-01-05T09:00:00.000Z', actor: 'Meera Krishnan', actorRole: 'employee' }
    ],
    documents: {}
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
    tasks: DEPARTMENTS.map(dept => ({
      id: `t-${dept.id}-003`,
      deptId: dept.id,
      deptLabel: dept.label,
      assigneeId: dept.defaultAssignee,
      assigneeName: dept.label,
      status: 'approved',
      slaHours: dept.slaHours,
      slaDueAt: '2024-11-05T00:00:00.000Z',
      checklist: [...(CHECKLIST_TEMPLATES[dept.id] || [])].map(item => ({ ...item, checked: true })),
    })),
    timeline: [
      { id: 'ev-3-1', label: 'Resignation submitted', timestamp: '2024-11-01T09:00:00.000Z', actor: 'Dev Anand', actorRole: 'employee' },
      { id: 'ev-3-2', label: 'Manager approved', timestamp: '2024-11-02T10:00:00.000Z', actor: 'Sunita Iyer', actorRole: 'manager' },
      { id: 'ev-3-last', label: 'Clearance completed', timestamp: '2024-11-20T10:00:00.000Z', actor: 'System', actorRole: 'system' }
    ],
    exitInterview: {
      overallRating: 4,
      managementRating: 4,
      cultureRating: 5,
      reason: 'Pursuing masters',
      improvements: 'More training budgets',
      wouldRejoin: true,
      comments: 'Great place to work!',
      completedAt: '2024-11-15T10:00:00.000Z'
    },
    documents: {
      relievingLetter: 'relieving-CASE-2024-003.pdf',
      experienceCertificate: 'experience-CASE-2024-003.pdf'
    }
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
    tasks: DEPARTMENTS.map(dept => {
      let status: TaskStatus = 'pending';
      let checkedItems = 0;
      let items = [...(CHECKLIST_TEMPLATES[dept.id] || [])].map(item => ({ ...item, checked: false }));
      
      if (dept.id === 'manager') {
         status = 'approved'; items.forEach(i => i.checked = true); 
      }
      return {
        id: `t-${dept.id}-004`,
        deptId: dept.id,
        deptLabel: dept.label,
        assigneeId: dept.defaultAssignee,
        assigneeName: dept.label,
        status,
        slaHours: dept.slaHours,
        slaDueAt: format(addHours(new Date('2025-01-12'), dept.slaHours), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        checklist: items,
      };
    }),
    timeline: [
      { id: 'ev-4-1', label: 'Resignation submitted', timestamp: '2025-01-10T09:00:00.000Z', actor: 'Priya Sharma', actorRole: 'employee' },
      { id: 'ev-4-2', label: 'Manager approved', timestamp: '2025-01-12T10:00:00.000Z', actor: 'Rahul Mehta', actorRole: 'manager' },
    ],
    documents: {
      resignationLetter: 'resignation-CASE-2024-004.pdf'
    }
  }
];

export const useExitStore = create<ExitStore>((set) => ({
  cases: SEED_CASES,
  addCase: (newCase) => set((state) => {
    const id = `CASE-${new Date().getFullYear()}-${String(state.cases.length + 1).padStart(3, '0')}`;
    return { cases: [{ ...newCase, id, documents: {} }, ...state.cases] };
  }),
  updateCaseStatus: (caseId, status) => set((state) => ({
    cases: state.cases.map(c => c.id === caseId ? { ...c, status } : c)
  })),
  checkItem: (caseId, deptId, itemId, checked) => set((state) => ({
    cases: state.cases.map(c => {
      if (c.id !== caseId) return c;
      const tasks = c.tasks.map(t => {
        if (t.deptId !== deptId) return t;
        const checklist = t.checklist.map(item => item.id === itemId ? { ...item, checked } : item);
        return { ...t, checklist, status: t.status === 'pending' ? 'in_progress' : t.status };
      });
      return { ...c, tasks };
    })
  })),
  setItemInput: (caseId, deptId, itemId, inputValue) => set((state) => ({
    cases: state.cases.map(c => {
      if (c.id !== caseId) return c;
      const tasks = c.tasks.map(t => {
        if (t.deptId !== deptId) return t;
        const checklist = t.checklist.map(item => item.id === itemId ? { ...item, inputValue } : item);
        return { ...t, checklist };
      });
      return { ...c, tasks };
    })
  })),
  approveTask: (caseId, deptId, notes) => set((state) => ({
    cases: state.cases.map(c => {
      if (c.id !== caseId) return c;
      const tasks = c.tasks.map(t => {
        if (t.deptId !== deptId) return t;
        return { ...t, status: 'approved', completedAt: new Date().toISOString(), notes };
      });
      const timeline = [
        { id: `evt-${Date.now()}`, label: `${DEPARTMENTS.find(d=>d.id === deptId)?.label} clearance approved`, timestamp: new Date().toISOString(), actor: 'Approver', actorRole: 'dept_approver' },
        ...c.timeline
      ];
      return { ...c, tasks, timeline };
    })
  })),
  rejectTask: (caseId, deptId, reason) => set((state) => ({
    cases: state.cases.map(c => {
      if (c.id !== caseId) return c;
      const tasks = c.tasks.map(t => {
        if (t.deptId !== deptId) return t;
        return { ...t, status: 'rejected', rejectionReason: reason };
      });
      const timeline = [
        { id: `evt-${Date.now()}`, label: `${DEPARTMENTS.find(d=>d.id === deptId)?.label} clearance rejected`, timestamp: new Date().toISOString(), actor: 'Approver', actorRole: 'dept_approver' },
        ...c.timeline
      ];
      return { ...c, tasks, timeline };
    })
  })),
  saveTaskDraft: (caseId, deptId, checklist) => set((state) => ({
    cases: state.cases.map(c => {
      if (c.id !== caseId) return c;
      const tasks = c.tasks.map(t => {
        if (t.deptId !== deptId) return t;
        return { ...t, checklist, status: 'in_progress' };
      });
      return { ...c, tasks };
    })
  })),
  generateDocument: (caseId, docType) => set((state) => ({
    cases: state.cases.map(c => {
      if (c.id !== caseId) return c;
      const docName = `${docType === 'relievingLetter' ? 'relieving' : 'experience'}-${c.id}.pdf`;
      const timeline = [
        { id: `evt-${Date.now()}`, label: `${docType === 'relievingLetter' ? 'Relieving Letter' : 'Experience Certificate'} generated`, timestamp: new Date().toISOString(), actor: 'HR', actorRole: 'hr' },
        ...c.timeline
      ];
      return { ...c, documents: { ...c.documents, [docType]: docName }, timeline };
    })
  })),
  saveExitInterview: (caseId, interview) => set((state) => ({
    cases: state.cases.map(c => c.id === caseId ? { ...c, exitInterview: { ...interview, completedAt: new Date().toISOString() } } : c)
  })),
  approveResignation: (caseId, actor) => set((state) => ({
    cases: state.cases.map(c => {
      if (c.id !== caseId) return c;
      const now = new Date();
      const tasks = c.tasks.map(t => ({
        ...t,
        slaDueAt: format(addHours(now, t.slaHours), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        status: t.deptId === 'manager' ? 'approved' : 'pending',
        completedAt: t.deptId === 'manager' ? now.toISOString() : undefined
      }));
      const timeline = [
        { id: `evt-${Date.now()}`, label: `Manager approved resignation`, timestamp: now.toISOString(), actor, actorRole: 'manager' },
        ...c.timeline
      ];
      return { ...c, status: 'in_clearance', tasks, timeline };
    })
  })),
  uploadDocument: (caseId, docType, fileName) => set((state) => ({
    cases: state.cases.map(c => {
      if (c.id !== caseId) return c;
      const timeline = [
        { id: `evt-${Date.now()}`, label: `${docType} uploaded`, timestamp: new Date().toISOString(), actor: 'Employee', actorRole: 'employee' },
        ...c.timeline
      ];
      return { ...c, documents: { ...c.documents, [docType]: fileName }, timeline };
    })
  }))
}));
