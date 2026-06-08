import { useQuery } from "@tanstack/react-query";
import { useExitStore } from "@/store/exitStore";
import { computeExitTrend, computeExitReasons, computeTurnaround, computeSLAPerformance } from "@/lib/analytics";

export function useExitTrends(months = 12) {
  return useQuery({
    queryKey: ["reports", "exit-trends", months],
    queryFn: () => computeExitTrend(useExitStore.getState().cases, months),
  });
}

export function useExitReasons() {
  return useQuery({
    queryKey: ["reports", "exit-reasons"],
    queryFn: () => computeExitReasons(useExitStore.getState().cases),
  });
}

export function useTurnaround() {
  return useQuery({
    queryKey: ["reports", "turnaround"],
    queryFn: () => computeTurnaround(useExitStore.getState().cases),
  });
}

export function useSLAPerformance(months = 6) {
  return useQuery({
    queryKey: ["reports", "sla-performance", months],
    queryFn: () => computeSLAPerformance(useExitStore.getState().cases, months),
  });
}
