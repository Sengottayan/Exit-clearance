import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useExitStore } from "@/store/exitStore";

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ caseId, docType, fileName }: { caseId: string; docType: "resignationLetter"; fileName: string }) => {
      useExitStore.getState().uploadDocument(caseId, docType, fileName);
      return { caseId, docType, fileName };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["cases", "detail", result.caseId] });
    },
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ caseId, fileName, actor }: { caseId: string; fileName: string; actor: string }) => {
      useExitStore.getState().uploadAttachment(caseId, fileName, actor);
      return { caseId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["cases", "detail", result.caseId] });
    },
  });
}

export function useGenerateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ caseId, docType }: { caseId: string; docType: "relievingLetter" | "experienceCertificate" }) => {
      useExitStore.getState().generateDocument(caseId, docType);
      return { caseId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["cases", "detail", result.caseId] });
    },
  });
}
