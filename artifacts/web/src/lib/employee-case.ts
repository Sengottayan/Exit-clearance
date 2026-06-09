import type { ExitCase, User } from "@/lib/types";

const ACTIVE_CASE_STATUSES = new Set(["pending_manager", "in_clearance"]);

function getCaseSortValue(exitCase: ExitCase) {
  const relevantDate =
    exitCase.lastWorkingDay ||
    exitCase.resignationDate ||
    exitCase.timeline[0]?.timestamp ||
    "";

  return new Date(relevantDate).getTime();
}

export function isActiveCaseStatus(status: ExitCase["status"]) {
  return ACTIVE_CASE_STATUSES.has(status);
}

export function isCaseOwnedByUser(exitCase: ExitCase, user: User | null | undefined) {
  if (!user) return false;

  const userEmployeeId = user.employeeId?.trim();
  const userEmail = user.email?.trim().toLowerCase();

  return (
    (!!userEmployeeId && exitCase.employeeId === userEmployeeId) ||
    (!!userEmail && exitCase.employeeEmail.trim().toLowerCase() === userEmail)
  );
}

export function getEmployeeCases(cases: ExitCase[], user: User | null | undefined) {
  return cases
    .filter((exitCase) => isCaseOwnedByUser(exitCase, user))
    .sort((a, b) => getCaseSortValue(b) - getCaseSortValue(a));
}

export function getActiveEmployeeCase(cases: ExitCase[], user: User | null | undefined) {
  return getEmployeeCases(cases, user).find((exitCase) => isActiveCaseStatus(exitCase.status)) ?? null;
}

export function getLatestEmployeeCase(cases: ExitCase[], user: User | null | undefined) {
  return getEmployeeCases(cases, user)[0] ?? null;
}
