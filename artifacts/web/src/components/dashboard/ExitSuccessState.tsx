import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/wouter";
import { CheckCircle2, FileText, Download, Mail, MessageSquare } from "lucide-react";

interface ExitSuccessStateProps {
  employeeName: string;
  caseId: string;
}

export function ExitSuccessState({ employeeName, caseId }: ExitSuccessStateProps) {
  return (
    <div className="space-y-6 animate-slide-up pb-8 bg-[#0b0f19] min-h-screen text-slate-200">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-tight">Congratulations, {employeeName} 🎉</h1>
      </div>
      
      <Card className="border border-emerald-500/20 bg-[#121927] rounded-xl shadow-[0_0_40px_rgba(16,185,129,0.05)] p-8 text-center flex flex-col items-center max-w-3xl mx-auto mt-6 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 mx-auto border border-emerald-500/20">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-3">Clearance Complete</h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto mb-8 leading-relaxed">
            Your exit clearance process (Case <span className="font-mono text-slate-300">{caseId}</span>) has been successfully finalized. All departments have signed off, and your final relieving documents are now available for download.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto mb-8">
            <Link href={`/cases/${caseId}?tab=documents`}>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download Relieving Letter
              </Button>
            </Link>
            <Link href={`/cases/${caseId}?tab=documents`}>
              <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 text-slate-200 font-bold h-12 rounded-xl flex items-center gap-2 bg-[#1a2333]">
                <FileText className="w-4 h-4 text-slate-400" />
                Experience Certificate
              </Button>
            </Link>
          </div>
        </div>

        <div className="w-full max-w-lg border-t border-white/5 pt-6 mt-2 relative z-10 text-left">
          <h3 className="text-sm font-bold text-slate-300 mb-4 text-center">Next Steps & Support</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
              <Mail className="w-5 h-5 text-blue-400 mb-2" />
              <h4 className="text-xs font-bold text-white mb-1">Final Settlement</h4>
              <p className="text-[10px] text-slate-400">Queries regarding F&F? Contact the payroll team directly.</p>
              <a href="mailto:payroll@company.com" className="text-[10px] text-blue-400 font-medium hover:underline mt-2 inline-block">payroll@company.com</a>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
              <MessageSquare className="w-5 h-5 text-purple-400 mb-2" />
              <h4 className="text-xs font-bold text-white mb-1">Alumni Network</h4>
              <p className="text-[10px] text-slate-400">Stay connected. Join our official corporate alumni group.</p>
              <a href="#" className="text-[10px] text-purple-400 font-medium hover:underline mt-2 inline-block">Join Network →</a>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
