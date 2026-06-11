import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/manager/dashboard/route';
import { getOptionalAuth } from '@/lib/api-auth';
import { createServerSupabase } from '@/lib/supabase-server';

vi.mock('@/lib/api-auth', () => ({
  getOptionalAuth: vi.fn(),
  unauthorized: vi.fn(() => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })),
}));

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabase: vi.fn(),
}));

describe('Manager Dashboard API Security Guards', () => {
  let mockSupabase: any;
  let mockQuery: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'manager' }, error: null }),
    };

    // Need a special mock for the multiple awaited queries in GET
    // It queries users, legacy_exit_cases (twice)
    mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { role: 'manager', email: 'manager@test.com' }, error: null })
          };
        }
        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: '00000000-0000-0000-0000-000000000000' }, error: null })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: (resolve: any) => resolve({ data: [], error: null })
        };
      }),
    };

    (createServerSupabase as any).mockReturnValue(mockSupabase);
  });

  it('should reject standard managers from overriding manager_id', async () => {
    (getOptionalAuth as any).mockResolvedValue({ userId: 'manager_123', orgId: 'org_1' });
    
    // Simulate user role query returning 'manager'
    const req = new NextRequest('http://localhost/api/manager/dashboard?manager_id=hacked_id_456', { method: 'GET' });
    const response = await GET(req);
    
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toMatch(/Forbidden/i);
  });

  it('should allow HR to override manager_id', async () => {
    (getOptionalAuth as any).mockResolvedValue({ userId: 'hr_123', orgId: 'org_1' });
    
    // Simulate user role query returning 'hr'
    mockSupabase.from = vi.fn((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { role: 'hr', email: 'hr@test.com' }, error: null })
        };
      }
      if (table === 'organizations') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: '00000000-0000-0000-0000-000000000000' }, error: null })
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: [], error: null })
      };
    });

    const req = new NextRequest('http://localhost/api/manager/dashboard?manager_id=manager_456', { method: 'GET' });
    const response = await GET(req);
    
    expect(response.status).toBe(200);
  });
});
