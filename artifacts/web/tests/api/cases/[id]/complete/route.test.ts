import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/cases/[id]/complete/route';
import { getOptionalAuth } from '@/lib/api-auth';
import { createServerSupabase } from '@/lib/supabase-server';

vi.mock('@/lib/api-auth', () => ({
  getOptionalAuth: vi.fn(),
  unauthorized: vi.fn(() => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })),
}));

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabase: vi.fn(),
}));

describe('complete API Security Guards', () => {
  let mockSupabase: any;
  let mockQuery: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'hr' }, error: null }),
    };

    mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: '00000000-0000-0000-0000-000000000000' }, error: null })
          };
        }
        return mockQuery;
      }),
    };

    (createServerSupabase as any).mockReturnValue(mockSupabase);
  });

  it('should reject requests from non-HR users', async () => {
    (getOptionalAuth as any).mockResolvedValue({ userId: 'emp_123', orgId: 'org_1' });
    
    mockQuery.single = vi.fn().mockResolvedValueOnce({ data: { role: 'manager' }, error: null });
    
    const req = new NextRequest('http://localhost/api/cases/1/complete', { method: 'POST' });
    const response = await POST(req, { params: Promise.resolve({ id: '1' }) });
    
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toMatch(/Forbidden/i);
  });

  it('should block completion if legal_hold is true', async () => {
    (getOptionalAuth as any).mockResolvedValue({ userId: 'hr_123', orgId: 'org_1' });
    
    mockQuery.single = vi.fn()
      .mockResolvedValueOnce({ data: { role: 'hr' }, error: null }) // Role check
      .mockResolvedValueOnce({ data: { legal_hold: true, payroll_status: 'settled' }, error: null }); // Pre-flight meta check
    
    const req = new NextRequest('http://localhost/api/cases/1/complete', { method: 'POST' });
    const response = await POST(req, { params: Promise.resolve({ id: '1' }) });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/Legal Hold/i);
  });

  it('should block completion if payroll_status is not settled', async () => {
    (getOptionalAuth as any).mockResolvedValue({ userId: 'hr_123', orgId: 'org_1' });
    
    mockQuery.single = vi.fn()
      .mockResolvedValueOnce({ data: { role: 'hr' }, error: null }) // Role check
      .mockResolvedValueOnce({ data: { legal_hold: false, payroll_status: 'pending' }, error: null }); // Pre-flight meta check
    
    const req = new NextRequest('http://localhost/api/cases/1/complete', { method: 'POST' });
    const response = await POST(req, { params: Promise.resolve({ id: '1' }) });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/Payroll F&F is not settled/i);
  });
});
