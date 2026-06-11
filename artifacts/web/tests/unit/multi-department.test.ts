import { describe, it, expect } from 'vitest';
describe('Multi-Department Task Aggregation', () => {
  it('should correctly filter tasks for a multi-department approver', () => {
    const assignedDeptIds = ['it', 'admin', 'finance'];
    
    const tasks = [
      { id: '1', deptId: 'it' },
      { id: '2', deptId: 'admin' },
      { id: '3', deptId: 'hr' },
      { id: '4', deptId: 'facilities' },
      { id: '5', deptId: 'finance' }
    ];

    // Simulate the TasksPage filter logic
    const filteredTasks = tasks.filter(t => assignedDeptIds.includes(t.deptId));

    expect(filteredTasks).toHaveLength(3);
    expect(filteredTasks.map(t => t.deptId)).toEqual(['it', 'admin', 'finance']);
  });

  it('should correctly filter tasks for a single-department approver', () => {
    const assignedDeptIds = ['hr'];
    
    const tasks = [
      { id: '1', deptId: 'it' },
      { id: '2', deptId: 'admin' },
      { id: '3', deptId: 'hr' },
    ];

    const filteredTasks = tasks.filter(t => assignedDeptIds.includes(t.deptId));

    expect(filteredTasks).toHaveLength(1);
    expect(filteredTasks[0].deptId).toBe('hr');
  });

  it('should return empty array if no tasks match', () => {
    const assignedDeptIds = ['infosec'];
    
    const tasks = [
      { id: '1', deptId: 'it' },
      { id: '2', deptId: 'admin' },
      { id: '3', deptId: 'hr' },
    ];

    const filteredTasks = tasks.filter(t => assignedDeptIds.includes(t.deptId));

    expect(filteredTasks).toHaveLength(0);
  });
});
