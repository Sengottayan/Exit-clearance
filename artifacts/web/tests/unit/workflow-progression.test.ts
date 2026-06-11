import { calculateWorkflowStage, validateTaskCompletion } from '@/lib/workflow-server';
import { describe, it, expect } from 'vitest';

describe('Workflow Progression Logic', () => {
  it('should return stage 1 (or 2 depending on definition) for pending_manager', () => {
    expect(calculateWorkflowStage('pending_manager', [])).toBe(2);
  });

  it('should return stage 3 when in_clearance with no tasks', () => {
    expect(calculateWorkflowStage('in_clearance', [])).toBe(3);
  });

  it('should return stage 3 when clearance tasks are pending', () => {
    const tasks = [
      { dept_id: 'admin', status: 'pending' },
      { dept_id: 'it', status: 'pending' }
    ];
    expect(calculateWorkflowStage('in_clearance', tasks)).toBe(3);
  });

  it('should return stage 4 when clearance tasks are done but assets are pending', () => {
    const tasks = [
      { dept_id: 'admin', status: 'approved' },
      { dept_id: 'finance', status: 'completed' },
      { dept_id: 'it', status: 'pending' }
    ];
    expect(calculateWorkflowStage('in_clearance', tasks)).toBe(4);
  });

  it('should return stage 5 when both clearance and assets are done', () => {
    const tasks = [
      { dept_id: 'admin', status: 'approved' },
      { dept_id: 'it', status: 'approved' }
    ];
    expect(calculateWorkflowStage('in_clearance', tasks)).toBe(5);
  });

  it('should not allow task completion if case is pending_manager', () => {
    const validation = validateTaskCompletion('t1', 'pending_manager', []);
    expect(validation.allowed).toBe(false);
  });

  it('should not allow task completion if case is completed', () => {
    const validation = validateTaskCompletion('t1', 'completed', []);
    expect(validation.allowed).toBe(false);
  });
});
