export type Role = 'employee' | 'manager' | 'hr' | 'dept_approver' | 'admin';
export type DeptId = 'manager' | 'it' | 'admin' | 'finance' | 'procurement' | 'infosec' | 'hr' | 'facilities';
export type CaseStatus = 'pending_manager' | 'in_clearance' | 'completed' | 'cancelled';
export type TaskStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'overdue';

export interface User {
  id: string;          // Clerk user ID (primary key in DB)
  email: string;
  password?: string;
  role: Role;
  name: string;
  dept: string;
  employeeId: string;  // HR system employee number (e.g. EMP-1042)
  managerId?: string;  // Clerk user ID of the reporting manager
  managerName?: string;
  jobTitle?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  isMandatory: boolean;
  hasInput: boolean;
  inputLabel?: string;
  checked: boolean;
  inputValue?: string;
}

export interface ClearanceTask {
  id: string;
  deptId: DeptId;
  deptLabel: string;
  assigneeId: string;
  assigneeName: string;
  status: TaskStatus;
  slaHours: number;
  slaDueAt: string; // ISO date
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  rejectionReason?: string;
  checklist: ChecklistItem[];
}

export interface TimelineEvent {
  id: string;
  label: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  isPending?: boolean;
  status?: string;
  message?: string;
}

export type CommentVisibility = 'all' | 'internal';

export interface CaseComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  message: string;
  timestamp: string;
  visibility: CommentVisibility;
}

export interface CaseAttachment {
  id: string;
  name: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ExitInterview {
  overallRating: number; // 1-5
  managementRating: number;
  cultureRating: number;
  reason: string;
  improvements: string;
  wouldRejoin: boolean;
  comments: string;
  completedAt?: string;
}

export interface ExitCase {
  id: string;
  createdAt?: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeRole: string;
  employeeDept: string;
  managerId: string;
  managerName: string;
  managerEmail?: string;
  status: CaseStatus;
  resignationDate: string;
  lastWorkingDay: string;
  noticePeriodDays: number;
  exitReason: string;
  tasks: ClearanceTask[];
  timeline: TimelineEvent[];
  exitInterview?: ExitInterview;
  documents: {
    resignationLetter?: string;
    relievingLetter?: string;
    experienceCertificate?: string;
    attachments?: CaseAttachment[];
  };
  comments?: CaseComment[];
  escalated?: boolean;
  cancelReason?: string;
  tags?: string[];
  workflowStage?: number;
}

export interface Department {
  id: DeptId;
  label: string;
  icon: string;
  isMandatory: boolean;
  slaHours: number;
  defaultAssignee: string;
}

export interface ChecklistTemplate {
  id: string;
  label: string;
  isMandatory: boolean;
  hasInput: boolean;
  inputLabel?: string;
}
