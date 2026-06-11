import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as approveResignation } from '@/app/api/cases/[id]/approve-resignation/route';
import { NextRequest } from 'next/server';

// Mock getOptionalAuth
vi.mock('@/lib/api-auth', () => ({
  getOptionalAuth: vi.fn().mockResolvedValue({ userId: 'test-user-id', orgId: 'org_1' }),
  unauthorized: vi.fn().mockReturnValue(new Response('Unauthorized', { status: 401 }))
}));

// Mock the supabase client
const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabase: vi.fn(() => ({
    from: vi.fn().mockReturnValue({
      update: mockUpdate,
      insert: mockInsert,
      select: mockSelect
    })
  }))
}));

describe('Employee Resignation Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockImplementation((field, value) => {
      const chainable: any = Promise.resolve({ data: null, error: null });
      chainable.eq = mockEq;
      chainable.select = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'CASE-123', status: 'in_clearance' }, error: null })
      });
      chainable.single = vi.fn().mockResolvedValue({ data: { role: 'manager' }, error: null });
      
      if (field === 'case_id' && value === 'CASE-123') {
        return Promise.resolve({
          data: [
            { id: 'task-1', dept_id: 'manager', sla_hours: 24 },
            { id: 'task-2', dept_id: 'it', sla_hours: 48 }
          ],
          error: null
        });
      }
      if (field === 'id' && value === 'CASE-123') {
        chainable.single = mockSingle.mockResolvedValue({ data: { id: 'CASE-123', status: 'in_clearance' }, error: null });
        return chainable;
      }
      return chainable;
    });
    
    mockInsert.mockResolvedValue({ error: null });
  });

  it('Phase 2: Manager Approval - transitions to in_clearance and generates tasks', async () => {
    // Simulate the request
    const req = new NextRequest('http://localhost/api/cases/CASE-123/approve-resignation', {
      method: 'POST',
      body: JSON.stringify({ actor: 'Test Manager' })
    });
    
    const params = Promise.resolve({ id: 'CASE-123' });

    const res = await approveResignation(req, { params });
    const json = await res.json();

    // Verification 1: Case status updated
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'in_clearance' });
    
    // Verification 2: Manager task approved
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      status: 'approved'
    }));
    
    // Verification 3: IT task set to pending
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      status: 'pending'
    }));

    // Verification 4: Timeline event created
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      label: 'Manager approved resignation',
      actor: 'Test Manager',
      actor_role: 'manager'
    }));

    // Verification 5: API returns successfully
    expect(res.status).toBe(200);
    expect(json).toEqual({ id: 'CASE-123', status: 'in_clearance' });
  });
});
