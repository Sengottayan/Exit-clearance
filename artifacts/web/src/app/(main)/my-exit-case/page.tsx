"use client";

import { useAuth } from "@/hooks/useAuth";
import { useCases } from "@/hooks/api/useCases";
import { useRouter } from "next/navigation";
import { getActiveEmployeeCase, getLatestEmployeeCase } from "@/lib/employee-case";
import { GlobalLoading } from "@/components/shared/GlobalLoading";
import { useEffect } from "react";

export default function Page() {
  const { user, isEmployee } = useAuth();
  const { data: cases = [], isLoading } = useCases();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !user) return;

    if (!isEmployee) {
      router.replace("/cases");
      return;
    }

    const activeCase = getActiveEmployeeCase(cases, user);
    const latestCase = getLatestEmployeeCase(cases, user);

    if (activeCase) {
      router.replace(`/cases/${activeCase.id}`);
    } else if (latestCase) {
      router.replace(`/cases/${latestCase.id}`);
    } else {
      router.replace("/resign");
    }
  }, [isLoading, isEmployee, cases, user, router]);

  return <GlobalLoading />;
}
