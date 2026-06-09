"use client";

import { useAuth } from "@/hooks/useAuth";
import { useCases } from "@/hooks/api/useCases";
import { Redirect } from "@/lib/wouter";
import { getActiveEmployeeCase, getLatestEmployeeCase } from "@/lib/employee-case";
import { GlobalLoading } from "@/components/shared/GlobalLoading";

export default function Page() {
  const { user, isEmployee } = useAuth();
  const { data: cases = [], isLoading } = useCases();

  if (!isEmployee) return <Redirect to="/cases" />;
  if (isLoading) return <GlobalLoading />;

  const activeCase = getActiveEmployeeCase(cases, user);
  const latestCase = getLatestEmployeeCase(cases, user);

  if (activeCase) return <Redirect to={`/cases/${activeCase.id}`} />;
  if (latestCase) return <Redirect to={`/cases/${latestCase.id}`} />;
  return <Redirect to="/resign" />;
}
