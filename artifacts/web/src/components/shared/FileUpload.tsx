"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { UploadCloud, File, X, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileUploadProps {
  caseId: string;
  onUploadComplete?: () => void;
}

export function FileUpload({ caseId, onUploadComplete }: FileUploadProps) {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    try {
      // 1. Upload to Supabase Storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/${caseId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("exit-documents")
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 2. Get Public URL (or just save path, depending on bucket privacy. Assuming private bucket, we save path)
      // We will save the metadata to our database table
      const res = await fetch(`/api/cases/${caseId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedFile.name,
          file_path: uploadData.path,
          file_type: selectedFile.type,
          size_bytes: selectedFile.size,
        }),
      });

      if (!res.ok) throw new Error("Failed to save document metadata");

      toast.success("Document uploaded successfully");
      setSelectedFile(null);
      if (onUploadComplete) onUploadComplete();
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "relative w-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all duration-200 glass-panel",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-white/10 hover:border-white/20 hover:bg-white/5"
          )}
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileSelect}
            disabled={isUploading}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
          <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4 border border-white/10 shadow-sm">
            <UploadCloud className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">Click to upload or drag and drop</p>
          <p className="text-xs text-muted-foreground font-medium">PDF, DOC, PNG or JPG (max. 10MB)</p>
        </div>
      ) : (
        <div className="w-full p-4 rounded-xl glass-panel border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 overflow-hidden">
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <File className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4 shrink-0">
            {isUploading ? (
              <Button disabled variant="outline" size="sm" className="w-[100px] h-9 font-semibold text-xs">
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                Uploading
              </Button>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={handleUpload}
                  size="sm" 
                  className="h-9 px-4 font-bold text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Confirm Upload
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
