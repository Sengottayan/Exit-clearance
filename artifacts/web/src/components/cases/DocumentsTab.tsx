import { useRef } from "react";
import { ExitCase } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Lock, Upload, Paperclip } from "lucide-react";
import * as Icons from "lucide-react";
import { useGenerateDocument, useUploadDocument, useUploadAttachment } from "@/hooks/api/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDate, cn } from "@/lib/utils";
import { DEPARTMENTS } from "@/lib/constants";
import { FileUpload } from "@/components/shared/FileUpload";
import { Badge } from "@/components/ui/badge";

export function DocumentsTab({ exitCase }: { exitCase: ExitCase }) {
  const { user, isHR, isAdmin, isEmployee } = useAuth();
  const { mutate: generateDocument } = useGenerateDocument();
  const { mutate: uploadDocument } = useUploadDocument();
  const { mutate: uploadAttachment } = useUploadAttachment();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const mandatoryDeptIds = new Set(DEPARTMENTS.filter((d) => d.isMandatory).map((d) => d.id));
  const isClearanceComplete = exitCase.tasks
    .filter((t) => mandatoryDeptIds.has(t.deptId))
    .every((t) => t.status === "approved");

  const isOwnCase = user?.employeeId === exitCase.employeeId;
  const canUpload = (isEmployee && isOwnCase) || isHR || isAdmin;

  const handleGenerate = (type: "relievingLetter" | "experienceCertificate") => {
    generateDocument({ caseId: exitCase.id, docType: type });
    toast.success(`${type === "relievingLetter" ? "Relieving Letter" : "Experience Certificate"} generated.`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "resignation" | "attachment") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "resignation") {
      uploadDocument({ caseId: exitCase.id, docType: "resignationLetter", fileName: file.name });
      toast.success("Resignation letter uploaded");
    } else {
      uploadAttachment({ caseId: exitCase.id, fileName: file.name, actor: user?.name ?? "User" });
      toast.success("Attachment uploaded");
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">My Documents</h2>
          <p className="text-sm text-slate-400">Manage your exit process documents</p>
        </div>
        {canUpload && exitCase.status !== "cancelled" && (
          <Button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold">
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Badge variant="outline" className="bg-[#1e2a4f] text-[#8ab4f8] border-[#3b5998]/50 px-3 py-1 text-xs hover:bg-[#273866] cursor-pointer">
          All Documents <span className="ml-2 bg-[#0f1525] px-1.5 py-0.5 rounded text-[10px]">5</span>
        </Badge>
        <Badge variant="outline" className="text-slate-400 border-white/10 px-3 py-1 text-xs hover:text-white cursor-pointer bg-transparent">
          Uploaded By Me <span className="ml-2 bg-white/10 px-1.5 py-0.5 rounded text-[10px]">3</span>
        </Badge>
        <Badge variant="outline" className="text-slate-400 border-white/10 px-3 py-1 text-xs hover:text-white cursor-pointer bg-transparent">
          Pending Release
        </Badge>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileSelect(e, "resignation")} />
      <input type="file" ref={attachmentInputRef} className="hidden" onChange={(e) => handleFileSelect(e, "attachment")} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Resignation Letter */}
        <Card className="border border-white/5 bg-[#121927] rounded-xl flex flex-col hover:bg-[#161f30] transition-colors">
          <CardContent className="p-5 flex flex-col flex-1">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Resignation Letter</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">PDF • 245 KB</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-white">
                <Icons.MoreVertical className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="mb-6">
              <p className="text-[11px] text-slate-500">Uploaded by you</p>
              <p className="text-[11px] text-slate-400 font-medium">{formatDate(exitCase.resignationDate)}</p>
            </div>
            
            <div className="mt-auto grid grid-cols-2 gap-3">
              <Button variant="outline" size="sm" className="w-full bg-[#1e2a4f]/50 border-white/10 hover:bg-[#1e2a4f] text-slate-300 text-xs h-8">
                <Icons.Eye className="w-3.5 h-3.5 mr-2" /> Preview
              </Button>
              <Button variant="outline" size="sm" className="w-full bg-[#1e2a4f]/50 border-white/10 hover:bg-[#1e2a4f] text-slate-300 text-xs h-8">
                <Download className="w-3.5 h-3.5 mr-2" /> Download
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Relieving Letter (Locked or Available) */}
        <Card className={cn("border border-white/5 rounded-xl flex flex-col transition-colors", isClearanceComplete ? "bg-[#121927] hover:bg-[#161f30]" : "bg-[#1a1712]")}>
          <CardContent className="p-5 flex flex-col flex-1">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-3">
                <div className={cn("w-8 h-8 rounded flex items-center justify-center shrink-0", isClearanceComplete ? "bg-red-500/10" : "bg-amber-500/10")}>
                  {isClearanceComplete ? <FileText className="w-4 h-4 text-red-500" /> : <Lock className="w-4 h-4 text-amber-500" />}
                </div>
                <div>
                  <h4 className={cn("text-sm font-bold", isClearanceComplete ? "text-slate-200" : "text-amber-500")}>Relieving Letter</h4>
                  {isClearanceComplete && <p className="text-[10px] text-slate-500 mt-0.5">PDF • 180 KB</p>}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-white">
                <Icons.MoreVertical className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="mb-6">
              {isClearanceComplete ? (
                <>
                  <p className="text-[11px] text-slate-500">Generated automatically</p>
                  <p className="text-[11px] text-slate-400 font-medium">Available</p>
                </>
              ) : (
                <p className="text-xs text-amber-500/80">Will be available after all clearances</p>
              )}
            </div>
            
            <div className="mt-auto">
              {isClearanceComplete ? (
                <div className="grid grid-cols-2 gap-3">
                  {(isHR || isAdmin) && (
                    <Button variant="outline" size="sm" onClick={() => handleGenerate("relievingLetter")} className="w-full bg-[#1e2a4f]/50 border-white/10 hover:bg-[#1e2a4f] text-slate-300 text-xs h-8">
                      <Icons.RefreshCw className="w-3.5 h-3.5 mr-2" /> Generate
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="w-full bg-[#1e2a4f]/50 border-white/10 hover:bg-[#1e2a4f] text-slate-300 text-xs h-8">
                    <Download className="w-3.5 h-3.5 mr-2" /> Download
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="h-1.5 w-full bg-[#2a2419] rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '60%' }} />
                  </div>
                  <p className="text-[10px] text-amber-500/80 mt-2">60% Completed</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Experience Certificate (Locked or Available) */}
        <Card className={cn("border border-white/5 rounded-xl flex flex-col transition-colors", isClearanceComplete ? "bg-[#121927] hover:bg-[#161f30]" : "bg-[#1a1712]")}>
          <CardContent className="p-5 flex flex-col flex-1">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-3">
                <div className={cn("w-8 h-8 rounded flex items-center justify-center shrink-0", isClearanceComplete ? "bg-red-500/10" : "bg-amber-500/10")}>
                  {isClearanceComplete ? <FileText className="w-4 h-4 text-red-500" /> : <Lock className="w-4 h-4 text-amber-500" />}
                </div>
                <div>
                  <h4 className={cn("text-sm font-bold", isClearanceComplete ? "text-slate-200" : "text-amber-500")}>Experience Certificate</h4>
                  {isClearanceComplete && <p className="text-[10px] text-slate-500 mt-0.5">PDF • 180 KB</p>}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-white">
                <Icons.MoreVertical className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="mb-6">
              {isClearanceComplete ? (
                <>
                  <p className="text-[11px] text-slate-500">Generated automatically</p>
                  <p className="text-[11px] text-slate-400 font-medium">Available</p>
                </>
              ) : (
                <p className="text-xs text-amber-500/80">Will be available after all clearances</p>
              )}
            </div>
            
            <div className="mt-auto">
              {isClearanceComplete ? (
                <div className="grid grid-cols-2 gap-3">
                  {(isHR || isAdmin) && (
                    <Button variant="outline" size="sm" onClick={() => handleGenerate("experienceCertificate")} className="w-full bg-[#1e2a4f]/50 border-white/10 hover:bg-[#1e2a4f] text-slate-300 text-xs h-8">
                      <Icons.RefreshCw className="w-3.5 h-3.5 mr-2" /> Generate
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="w-full bg-[#1e2a4f]/50 border-white/10 hover:bg-[#1e2a4f] text-slate-300 text-xs h-8">
                    <Download className="w-3.5 h-3.5 mr-2" /> Download
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="h-1.5 w-full bg-[#2a2419] rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '60%' }} />
                  </div>
                  <p className="text-[10px] text-amber-500/80 mt-2">60% Completed</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
