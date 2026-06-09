import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useExitStore } from "@/store/exitStore";

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ caseId, docType, fileName }: { caseId: string; docType: "resignationLetter"; fileName: string }) => {
      try {
        const res = await fetch(`/api/cases/${caseId}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ doc_type: docType, file_name: fileName }),
        });
        if (!res.ok) throw new Error("API unavailable");
      } catch {
        useExitStore.getState().uploadDocument(caseId, docType, fileName);
      }
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
      try {
        const res = await fetch(`/api/cases/${caseId}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ doc_type: "attachment", file_name: fileName, uploaded_by: actor }),
        });
        if (!res.ok) throw new Error("API unavailable");
      } catch {
        useExitStore.getState().uploadAttachment(caseId, fileName, actor);
      }
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
      try {
        const res = await fetch(`/api/cases/${caseId}/documents/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ doc_type: docType }),
        });
        if (!res.ok) throw new Error("API unavailable");
      } catch {
        useExitStore.getState().generateDocument(caseId, docType);
      }
      return { caseId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["cases", "detail", result.caseId] });
    },
  });
}
