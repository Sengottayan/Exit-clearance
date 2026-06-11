import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/webhooks/clerk/route';
import { createServerSupabase } from '@/lib/supabase-server';

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabase: vi.fn(),
}));

describe('Clerk Webhook API Handler', () => {
  let mockSupabase: any;
  let mockFrom: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockFrom = {
      upsert: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };

    mockSupabase = {
      from: vi.fn(() => mockFrom),
    };

    (createServerSupabase as any).mockReturnValue(mockSupabase);
  });

  it('should process organization.created event', async () => {
    // Mock successful organization upsert select
    mockFrom.single.mockResolvedValue({ data: { id: 'org-uuid-123' }, error: null });

    const payload = {
      type: 'organization.created',
      data: {
        id: 'org_clerk_123',
        name: 'Test Org',
        slug: 'test-org',
        created_by: 'user_clerk_123',
      },
    };

    const req = new NextRequest('http://localhost/api/webhooks/clerk', {
      method: 'POST',
      headers: {
        'x-test-bypass': 'true',
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    // Verify organization upsert
    expect(mockSupabase.from).toHaveBeenCalledWith('organizations');
    expect(mockFrom.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        clerk_org_id: 'org_clerk_123',
        name: 'Test Org',
        slug: 'test-org',
      }),
      { onConflict: 'clerk_org_id' }
    );

    // Verify default roles seeding
    expect(mockSupabase.from).toHaveBeenCalledWith('roles');
    expect(mockFrom.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'HR Admin', organization_id: 'org-uuid-123' }),
      ]),
      { onConflict: 'organization_id,name' }
    );
  });

  it('should process organizationMembership.created event', async () => {
    // Resolve organization: return mock org UUID
    // Check user: return null (not found)
    // Check role: return mock role UUID
    mockFrom.single
      .mockResolvedValueOnce({ data: { id: 'org-uuid-123' }, error: null }) // org select
      .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } }) // user exists select
      .mockResolvedValueOnce({ data: { id: 'member-uuid-123' }, error: null }) // member upsert select
      .mockResolvedValueOnce({ data: { id: 'role-uuid-123' }, error: null }); // role select

    const payload = {
      type: 'organizationMembership.created',
      data: {
        organization: { id: 'org_clerk_123' },
        public_user_data: {
          user_id: 'user_clerk_456',
          identifier: 'user@test.com',
          first_name: 'John',
          last_name: 'Doe',
        },
        role: 'org:admin',
      },
    };

    const req = new NextRequest('http://localhost/api/webhooks/clerk', {
      method: 'POST',
      headers: {
        'x-test-bypass': 'true',
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    // Verify skeleton user creation
    expect(mockSupabase.from).toHaveBeenCalledWith('users');
    expect(mockFrom.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user_clerk_456',
        email: 'user@test.com',
        role: 'admin',
      })
    );

    // Verify member upsert
    expect(mockSupabase.from).toHaveBeenCalledWith('organization_members');
    expect(mockFrom.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'org-uuid-123',
        user_id: 'user_clerk_456',
      }),
      { onConflict: 'organization_id,user_id' }
    );

    // Verify role assignment
    expect(mockSupabase.from).toHaveBeenCalledWith('roles');
    expect(mockFrom.eq).toHaveBeenCalledWith('name', 'HR Admin');

    expect(mockSupabase.from).toHaveBeenCalledWith('member_roles');
    expect(mockFrom.delete).toHaveBeenCalledWith();
    expect(mockFrom.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        member_id: 'member-uuid-123',
        role_id: 'role-uuid-123',
      })
    );
  });
});
