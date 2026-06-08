import { Department, ChecklistTemplate, User } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', email: 'priya@company.com',  password: 'demo', role: 'employee',      name: 'Priya Sharma',   dept: 'Engineering',   employeeId: 'EMP-1042' },
  { id: 'u2', email: 'rahul@company.com',  password: 'demo', role: 'manager',       name: 'Rahul Mehta',    dept: 'Engineering',   employeeId: 'MGR-201'  },
  { id: 'u3', email: 'anita@company.com',  password: 'demo', role: 'hr',            name: 'Anita Desai',    dept: 'HR',            employeeId: 'HR-001'   },
  { id: 'u4', email: 'kiran@company.com',  password: 'demo', role: 'dept_approver', name: 'Kiran Patel',    dept: 'IT',            employeeId: 'IT-101'   },
  { id: 'u5', email: 'sunita@company.com', password: 'demo', role: 'dept_approver', name: 'Sunita Rao',     dept: 'Finance',       employeeId: 'FIN-201'  },
  { id: 'u6', email: 'admin@company.com',  password: 'demo', role: 'admin',         name: 'System Admin',   dept: 'IT',            employeeId: 'ADM-001'  },
  { id: 'u7', email: 'admin_dept@company.com', password: 'demo', role: 'dept_approver', name: 'Admin Dept', dept: 'Administration', employeeId: 'ADM-101' },
  { id: 'u8', email: 'procurement@company.com', password: 'demo', role: 'dept_approver', name: 'Procurement', dept: 'Procurement', employeeId: 'PRO-101' },
  { id: 'u9', email: 'infosec@company.com', password: 'demo', role: 'dept_approver', name: 'InfoSec', dept: 'Info Security', employeeId: 'SEC-101' },
  { id: 'u10', email: 'facilities@company.com', password: 'demo', role: 'dept_approver', name: 'Facilities', dept: 'Facilities', employeeId: 'FAC-101' },
  { id: 'u11', email: 'sunita.iyer@company.com', password: 'demo', role: 'manager', name: 'Sunita Iyer', dept: 'Product', employeeId: 'MGR-202' },
];

export const DEPARTMENTS: Department[] = [
  { id: 'manager',     label: 'Manager Clearance', icon: 'Users',       isMandatory: true,  slaHours: 48, defaultAssignee: 'u2' },
  { id: 'it',          label: 'IT',                icon: 'Monitor',     isMandatory: true,  slaHours: 24, defaultAssignee: 'u4' },
  { id: 'admin',       label: 'Administration',    icon: 'Building2',   isMandatory: true,  slaHours: 24, defaultAssignee: 'u7' },
  { id: 'finance',     label: 'Finance',           icon: 'Landmark',    isMandatory: true,  slaHours: 48, defaultAssignee: 'u5' },
  { id: 'procurement', label: 'Procurement',       icon: 'Package',     isMandatory: false, slaHours: 48, defaultAssignee: 'u8' },
  { id: 'infosec',     label: 'Info Security',     icon: 'ShieldCheck', isMandatory: true,  slaHours: 24, defaultAssignee: 'u9' },
  { id: 'hr',          label: 'HR',                icon: 'Heart',       isMandatory: true,  slaHours: 72, defaultAssignee: 'u3' },
  { id: 'facilities',  label: 'Facilities',        icon: 'MapPin',      isMandatory: false, slaHours: 24, defaultAssignee: 'u10'},
];

export const CHECKLIST_TEMPLATES: Record<string, ChecklistTemplate[]> = {
  it: [
    { id: 'it-1', label: 'Laptop returned and condition verified', isMandatory: true,  hasInput: true,  inputLabel: 'Asset tag / Serial number' },
    { id: 'it-2', label: 'Mobile device returned (if applicable)', isMandatory: false, hasInput: false },
    { id: 'it-3', label: 'Corporate email account deactivated',    isMandatory: true,  hasInput: false },
    { id: 'it-4', label: 'VPN credentials revoked',               isMandatory: true,  hasInput: false },
    { id: 'it-5', label: 'All application access removed',         isMandatory: true,  hasInput: false },
    { id: 'it-6', label: 'GitHub / GitLab access removed',         isMandatory: true,  hasInput: false },
    { id: 'it-7', label: 'Data backup verified',                   isMandatory: true,  hasInput: false },
  ],
  finance: [
    { id: 'fin-1', label: 'Salary advance fully recovered',        isMandatory: true,  hasInput: true,  inputLabel: 'Amount (₹)' },
    { id: 'fin-2', label: 'Loan balance settled',                  isMandatory: true,  hasInput: true,  inputLabel: 'Amount (₹)' },
    { id: 'fin-3', label: 'Pending expense claims processed',      isMandatory: true,  hasInput: false },
    { id: 'fin-4', label: 'Final settlement amount confirmed',     isMandatory: true,  hasInput: true,  inputLabel: 'Net settlement (₹)' },
  ],
  admin: [
    { id: 'adm-1', label: 'Employee ID card returned',            isMandatory: true,  hasInput: false },
    { id: 'adm-2', label: 'Access / swipe card returned',         isMandatory: true,  hasInput: true,  inputLabel: 'Card number' },
    { id: 'adm-3', label: 'Parking tag surrendered',              isMandatory: false, hasInput: false },
    { id: 'adm-4', label: 'Office keys returned',                 isMandatory: true,  hasInput: false },
    { id: 'adm-5', label: 'Desk cleared and handed over',         isMandatory: true,  hasInput: false },
  ],
  manager: [
    { id: 'mgr-1', label: 'All projects handed over',             isMandatory: true,  hasInput: false },
    { id: 'mgr-2', label: 'Knowledge transfer sessions completed', isMandatory: true, hasInput: false },
    { id: 'mgr-3', label: 'All timesheets submitted and approved', isMandatory: true, hasInput: false },
    { id: 'mgr-4', label: 'Client introductions made',            isMandatory: false, hasInput: false },
    { id: 'mgr-5', label: 'Release date confirmed',               isMandatory: true,  hasInput: false },
  ],
  infosec: [
    { id: 'sec-1', label: 'Security compliance sign-off completed', isMandatory: true,  hasInput: false },
    { id: 'sec-2', label: 'Data confidentiality agreement signed',  isMandatory: true,  hasInput: false },
    { id: 'sec-3', label: 'Full access review completed',           isMandatory: true,  hasInput: false },
  ],
  hr: [
    { id: 'hr-1', label: 'Exit interview completed',              isMandatory: true,  hasInput: false },
    { id: 'hr-2', label: 'All HR documents collected',            isMandatory: true,  hasInput: false },
    { id: 'hr-3', label: 'Policy compliance verified',            isMandatory: true,  hasInput: false },
    { id: 'hr-4', label: 'Final approval granted',                isMandatory: true,  hasInput: false },
  ],
  procurement: [
    { id: 'pro-1', label: 'Vendor-owned assets returned',         isMandatory: true,  hasInput: false },
    { id: 'pro-2', label: 'Asset procurement records closed',     isMandatory: true,  hasInput: false },
  ],
  facilities: [
    { id: 'fac-1', label: 'Workspace inspected and handed over',  isMandatory: true,  hasInput: false },
    { id: 'fac-2', label: 'Facility access fully closed',         isMandatory: true,  hasInput: false },
  ],
};

export const EXIT_REASONS = [
  { value: 'better_opportunity', label: 'Better Opportunity'  },
  { value: 'compensation',       label: 'Compensation'        },
  { value: 'personal',           label: 'Personal Reasons'    },
  { value: 'higher_studies',     label: 'Higher Studies'      },
  { value: 'relocation',         label: 'Relocation'          },
  { value: 'work_environment',   label: 'Work Environment'    },
  { value: 'health',             label: 'Health Reasons'      },
  { value: 'other',              label: 'Other'               },
];

export const ROLE_LABELS: Record<string, string> = {
  employee:      'Employee',
  manager:       'Manager',
  hr:            'HR Team',
  dept_approver: 'Dept. Approver',
  admin:         'Administrator',
};

export const NAV_CONFIG = {
  employee: [
    { icon: 'LayoutDashboard', label: 'My Exit Status',     href: '/dashboard' },
    { icon: 'FolderOpen',      label: 'My Exit Case',       href: '/cases' },
    { icon: 'FileSignature',   label: 'Submit Resignation', href: '/resign' },
  ],
  manager: [
    { icon: 'LayoutDashboard', label: 'Dashboard',       href: '/dashboard' },
    { icon: 'Users',           label: 'Team Exits',      href: '/cases' },
  ],
  hr: [
    { icon: 'LayoutDashboard', label: 'Dashboard',       href: '/dashboard' },
    { icon: 'FolderOpen',      label: 'Exit Cases',      href: '/cases' },
    { icon: 'PlusCircle',      label: 'New Case',        href: '/cases/new' },
    { icon: 'BarChart2',       label: 'Reports',         href: '/reports' },
    { icon: 'ScrollText',      label: 'Audit Trail',     href: '/reports/audit' },
  ],
  dept_approver: [
    { icon: 'LayoutDashboard', label: 'Dashboard',       href: '/dashboard' },
    { icon: 'ClipboardCheck',  label: 'My Tasks',        href: '/tasks' },
  ],
  admin: [
    { icon: 'LayoutDashboard', label: 'Dashboard',       href: '/dashboard' },
    { icon: 'FolderOpen',      label: 'All Cases',       href: '/cases' },
    { icon: 'BarChart2',       label: 'Reports',         href: '/reports' },
    { icon: 'Settings',        label: 'Settings',        href: '/settings' },
  ],
};
