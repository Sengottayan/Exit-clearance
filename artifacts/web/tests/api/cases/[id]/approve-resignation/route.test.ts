import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/cases/[id]/approve-resignation/route';
import { getOptionalAuth } from '@/lib/api-auth';
import { createServerSupabase } from '@/lib/supabase-server';

vi.mock('@/lib/api-auth', () => ({
  getOptionalAuth: vi.fn(),
  unauthorized: vi.fn(() => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })),
}));

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabase: vi.fn(),
}));

describe('approve-resignation API Security Guards', () => {
  let mockSupabase: any;
  let mockQuery: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'employee' }, error: null }),
    };

    mockSupabase = {
      from: vi.fn(() => mockQuery),
    };

    (createServerSupabase as any).mockReturnValue(mockSupabase);
  });

  it('should reject requests from standard employees', async () => {
    (getOptionalAuth as any).mockResolvedValue({ userId: 'emp_123', orgId: 'org_1' });
    
    // Default mockQuery returns { role: 'employee' }
    
    const req = new NextRequest('http://localhost/api/cases/1/approve-resignation', { method: 'POST' });
    const response = await POST(req, { params: Promise.resolve({ id: '1' }) });
    
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toMatch(/Forbidden/i);
  });

  it('should accept requests from hr users', async () => {
    (getOptionalAuth as any).mockResolvedValue({ userId: 'hr_123', orgId: 'org_1' });
    
    mockQuery.single = vi.fn()
      .mockResolvedValueOnce({ data: { role: 'hr' }, error: null }) // user role check
      .mockResolvedValueOnce({ data: { id: '1' }, error: null })    // case update return
      .mockResolvedValueOnce({ data: { id: '1', status: 'in_clearance' }, error: null }); // final fetch return

    // Tasks fetch return
    mockSupabase.from = vi.fn((table: string) => {
      if (table === 'legacy_clearance_tasks') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [], error: null })
        };
      }
      return mockQuery;
    });

    const req = new NextRequest('http://localhost/api/cases/1/approve-resignation', { method: 'POST', body: JSON.stringify({}) });
    const response = await POST(req, { params: Promise.resolve({ id: '1' }) });
    
    expect(response.status).toBe(200);
  });
});
