import { verifyTaskAccess } from '@/lib/api-auth';
import { describe, it, expect, vi } from 'vitest';

// Mock the supabase client that verifyTaskAccess uses
vi.mock('@/lib/supabase-server', () => ({
  createServerSupabase: () => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn((field, value) => {
      // Mock user role response
      if (field === 'id' && value === 'admin-user') {
        return { single: () => Promise.resolve({ data: { role: 'admin' } }) };
      }
      if (field === 'id' && value === 'hr-user') {
        return { single: () => Promise.resolve({ data: { role: 'hr' } }) };
      }
      if (field === 'id' && value === 'manager-user') {
        return { single: () => Promise.resolve({ data: { role: 'manager' } }) };
      }
      if (field === 'id' && value === 'dept-user') {
        return { single: () => Promise.resolve({ data: { role: 'dept_approver' } }) };
      }
      
      // Mock department assignment response
      if (field === 'user_id' && value === 'dept-user') {
        return { 
          then: (cb: any) => cb({ data: [{ department: 'it' }] }) 
        };
      }
      if (field === 'user_id' && value === 'manager-user') {
        return { 
          then: (cb: any) => cb({ data: [] }) 
        };
      }

      return { single: () => Promise.resolve({ data: null }) };
    }),
  }),
}));

describe('Task Permissions (verifyTaskAccess)', () => {
  it('should allow admin to access any department task', async () => {
    const access = await verifyTaskAccess('admin-user', 'finance');
    expect(access).toBe(true);
  });

  it('should allow hr to access any department task', async () => {
    const access = await verifyTaskAccess('hr-user', 'it');
    expect(access).toBe(true);
  });

  it('should allow department approver to access their assigned department task', async () => {
    const access = await verifyTaskAccess('dept-user', 'it');
    expect(access).toBe(true);
  });

  it('should deny department approver from accessing unassigned department task', async () => {
    const access = await verifyTaskAccess('dept-user', 'finance');
    expect(access).toBe(false);
  });

  it('should deny manager from accessing department tasks (they are not assigned)', async () => {
    const access = await verifyTaskAccess('manager-user', 'it');
    expect(access).toBe(false);
  });
});
