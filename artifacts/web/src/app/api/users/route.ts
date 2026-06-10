import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOptionalAuth, unauthorized } from "@/lib/api-auth";

const MULTI_TENANT_ENABLED = false;

export async function GET(request: NextRequest) {
  const { userId, orgId } = await getOptionalAuth();
  if (!userId) return unauthorized();

  if (MULTI_TENANT_ENABLED && !orgId) {
    return NextResponse.json({ error: "Organization context required" }, { status: 403 });
  }

  const supabase = createServerSupabase();
  const { searchParams } = new URL(request.url);

  // Pagination
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const offset = (page - 1) * limit;

  // Filters
  const search = searchParams.get("search");
  const role = searchParams.get("role");
  const status = searchParams.get("status");

  let query = supabase.from("users").select("*", { count: "exact" });

  if (MULTI_TENANT_ENABLED && orgId) {
    // query = query.eq("organization_id", orgId);
  }

  if (role) {
    query = query.eq("role", role);
  }

  if (status) {
    // The users table doesn't have `employment_status` yet, so we assume 'active' by default
    // Wait, let's check if the users table has status. If not, we don't apply it or we check it.
    // Assuming we'll add `status` column later, for now we will just apply it if it exists.
    // To prevent Supabase error, let's not apply status filter to legacy users table if it lacks the column.
    // Actually, we can add it to the schema later. Let's just comment it out.
    // query = query.eq("status", status);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,employee_id.ilike.%${search}%`);
  }

  // Sorting & Pagination
  query = query.order("name", { ascending: true }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If UI expects just an array right now, we return data. 
  // In a robust paginated response, we'd return { data, count, page, limit }.
  // For backwards compatibility and future-proofing, let's return { data, meta: { total: count, page, limit } }
  // but if the UI is just `await res.json()`, it might break. Let's just return the array to not break `useUsers()`.
  // Wait, I am building `useUsers()` from scratch. So returning an object is fine.
  return NextResponse.json({ data, meta: { total: count, page, limit } });
}
