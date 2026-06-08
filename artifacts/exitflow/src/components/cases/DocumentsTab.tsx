import { ExitCase } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Lock } from "lucide-react";
import { useExitStore } from "@/store/exitStore";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

export function DocumentsTab({ exitCase }: { exitCase: ExitCase }) {
  const generateDocument = useExitStore(state => state.generateDocument);
  
  // All mandatory tasks must be approved
  const isClearanceComplete = exitCase.tasks.every(t => !DEPT_IS_MANDATORY(t.deptId) || t.status === 'approved');

  const handleGenerate = (type: 'relievingLetter' | 'experienceCertificate') => {
    generateDocument(exitCase.id, type);
    toast.success(`${type === 'relievingLetter' ? 'Relieving Letter' : 'Experience Certificate'} generated.`);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0 divide-y">
          <DocRow 
            title="Resignation Letter" 
            fileName={exitCase.documents.resignationLetter}
            date={exitCase.resignationDate}
            available={true}
          />
          <DocRow 
            title="Relieving Letter" 
            fileName={exitCase.documents.relievingLetter}
            date={exitCase.tasks.find(t=>t.deptId==='hr')?.completedAt}
            available={isClearanceComplete}
            onGenerate={() => handleGenerate('relievingLetter')}
            lockedMessage="Waiting for all mandatory clearances to complete"
          />
          <DocRow 
            title="Experience Certificate" 
            fileName={exitCase.documents.experienceCertificate}
            date={exitCase.tasks.find(t=>t.deptId==='hr')?.completedAt}
            available={isClearanceComplete}
            onGenerate={() => handleGenerate('experienceCertificate')}
            lockedMessage="Waiting for all mandatory clearances to complete"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function DEPT_IS_MANDATORY(deptId: string) {
  const optional = ['procurement', 'facilities'];
  return !optional.includes(deptId);
}

function DocRow({ title, fileName, date, available, onGenerate, lockedMessage }: any) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${available ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
          {available ? <FileText className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
        </div>
        <div>
          <p className={`font-medium ${!available && 'text-muted-foreground'}`}>{title}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {fileName ? fileName : available ? 'Not generated yet' : lockedMessage}
          </p>
          {fileName && date && <p className="text-[10px] text-muted-foreground mt-0.5">Generated {formatDate(date)}</p>}
        </div>
      </div>
      <div>
        {fileName ? (
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" /> Download
          </Button>
        ) : available && onGenerate ? (
          <Button onClick={onGenerate} size="sm">Generate PDF</Button>
        ) : null}
      </div>
    </div>
  );
}
