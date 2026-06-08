import { useRef } from "react";
import { ExitCase } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Lock, Upload, Paperclip } from "lucide-react";
import { useExitStore } from "@/store/exitStore";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { DEPARTMENTS } from "@/lib/constants";

export function DocumentsTab({ exitCase }: { exitCase: ExitCase }) {
  const { user, isHR, isAdmin, isEmployee } = useAuth();
  const generateDocument = useExitStore((s) => s.generateDocument);
  const uploadDocument = useExitStore((s) => s.uploadDocument);
  const uploadAttachment = useExitStore((s) => s.uploadAttachment);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const mandatoryDeptIds = new Set(DEPARTMENTS.filter((d) => d.isMandatory).map((d) => d.id));
  const isClearanceComplete = exitCase.tasks
    .filter((t) => mandatoryDeptIds.has(t.deptId))
    .every((t) => t.status === "approved");

  const isOwnCase = user?.employeeId === exitCase.employeeId;
  const canUpload = (isEmployee && isOwnCase) || isHR || isAdmin;

  const handleGenerate = (type: "relievingLetter" | "experienceCertificate") => {
    generateDocument(exitCase.id, type);
    toast.success(`${type === "relievingLetter" ? "Relieving Letter" : "Experience Certificate"} generated.`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "resignation" | "attachment") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "resignation") {
      uploadDocument(exitCase.id, "resignationLetter", file.name);
      toast.success("Resignation letter uploaded");
    } else {
      uploadAttachment(exitCase.id, file.name, user?.name ?? "User");
      toast.success("Attachment uploaded");
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      {canUpload && exitCase.status !== "cancelled" && (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="p-6">
            <div
              className="flex flex-col items-center justify-center text-center py-4 cursor-pointer"
              onClick={() => attachmentInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  uploadAttachment(exitCase.id, file.name, user?.name ?? "User");
                  toast.success("Attachment uploaded");
                }
              }}
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium">Drag & drop files here, or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOC, or image files up to 10 MB</p>
            </div>
            <input
              ref={attachmentInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={(e) => handleFileSelect(e, "attachment")}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Official Documents</CardTitle>
          <CardDescription>Generated and uploaded exit documents</CardDescription>
        </CardHeader>
        <CardContent className="p-0 divide-y">
          <DocRow
            title="Resignation Letter"
            fileName={exitCase.documents.resignationLetter}
            date={exitCase.resignationDate}
            available
            onUpload={
              canUpload && !exitCase.documents.resignationLetter
                ? () => fileInputRef.current?.click()
                : undefined
            }
          />
          <DocRow
            title="Relieving Letter"
            fileName={exitCase.documents.relievingLetter}
            date={exitCase.tasks.find((t) => t.deptId === "hr")?.completedAt}
            available={isClearanceComplete}
            onGenerate={(isHR || isAdmin) ? () => handleGenerate("relievingLetter") : undefined}
            lockedMessage="Waiting for all mandatory clearances to complete"
          />
          <DocRow
            title="Experience Certificate"
            fileName={exitCase.documents.experienceCertificate}
            date={exitCase.tasks.find((t) => t.deptId === "hr")?.completedAt}
            available={isClearanceComplete}
            onGenerate={(isHR || isAdmin) ? () => handleGenerate("experienceCertificate") : undefined}
            lockedMessage="Waiting for all mandatory clearances to complete"
          />
        </CardContent>
      </Card>

      {(exitCase.documents.attachments?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              Attachments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y">
            {exitCase.documents.attachments!.map((att) => (
              <div key={att.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{att.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded by {att.uploadedBy} · {formatDate(att.uploadedAt)}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx"
        onChange={(e) => handleFileSelect(e, "resignation")}
      />
    </div>
  );
}

function DocRow({
  title,
  fileName,
  date,
  available,
  onGenerate,
  onUpload,
  lockedMessage,
}: {
  title: string;
  fileName?: string;
  date?: string;
  available: boolean;
  onGenerate?: () => void;
  onUpload?: () => void;
  lockedMessage?: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${available ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
          {available ? <FileText className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
        </div>
        <div>
          <p className={`font-medium ${!available && "text-muted-foreground"}`}>{title}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {fileName ? fileName : available ? "Not uploaded yet" : lockedMessage}
          </p>
          {fileName && date && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(date)}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {fileName ? (
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" /> Download
          </Button>
        ) : onUpload ? (
          <Button onClick={onUpload} size="sm" variant="outline">
            <Upload className="w-4 h-4 mr-2" /> Upload
          </Button>
        ) : available && onGenerate ? (
          <Button onClick={onGenerate} size="sm">Generate PDF</Button>
        ) : null}
      </div>
    </div>
  );
}
