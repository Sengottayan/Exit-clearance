import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "@/lib/wouter";
import { useDepartments, useUpdateDepartment } from "@/hooks/api/useDepartments";
import { useUsers } from "@/hooks/api/useUsers";
import { Department } from "@/lib/types";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, Plus, ShieldCheck, Users, Activity, BarChart2, Edit2, Info } from "lucide-react";
import { DEPARTMENTS } from "@/lib/constants";
import { GlobalLoading } from "@/components/shared/GlobalLoading";

export default function SettingsDepartmentsPage() {
  const { isAdmin } = useAuth();
  const { data: departments = [], isLoading: isLoadingDepts } = useDepartments();
  const { mutate: updateDepartment, isPending: isUpdating } = useUpdateDepartment();
  
  const [activeDept, setActiveDept] = useState<Department | null>(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    slaHours: "",
    assignee: "",
    mandatory: true,
  });

  useEffect(() => {
    if (departments.length > 0 && !activeDept) {
      handleDeptSelect(departments[0]);
    }
  }, [departments, activeDept]);

  const { data: dbUsersResp } = useUsers({ limit: 50 });
  const assignees = Array.isArray(dbUsersResp) ? dbUsersResp : (dbUsersResp?.data || []);

  if (!isAdmin) return <Redirect to="/dashboard" />;

  const handleDeptSelect = (dept: Department) => {
    setActiveDept(dept);
    setFormData({
      slaHours: dept.slaHours.toString(),
      assignee: dept.defaultAssignee || "unassigned",
      mandatory: dept.isMandatory,
    });
  };

  const handleSave = () => {
    if (!activeDept) return;
    updateDepartment({
      id: activeDept.id,
      updates: {
        slaHours: parseInt(formData.slaHours, 10) || activeDept.slaHours,
        defaultAssignee: formData.assignee === "unassigned" ? undefined : formData.assignee,
        isMandatory: formData.mandatory,
      }
    }, {
      onSuccess: () => {
        toast.success(`${activeDept.label} configuration saved successfully`);
      },
      onError: (err: any) => {
        toast.error(`Failed to save: ${err.message}`);
      }
    });
  };

  if (isLoadingDepts) return <GlobalLoading />;
  if (!activeDept) return null;

  const filteredDepts = departments.filter((d: Department) => 
    d.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6 md:p-8 font-sans animate-in fade-in duration-500">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#8a94a6] text-sm mb-1">
            <span className="hover:text-white cursor-pointer transition-colors">Settings</span>
            <span>›</span>
            <span className="text-white font-medium">Departments</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Department Configurations</h1>
          <p className="text-[#8a94a6] text-sm font-medium">Manage department SLA targets and default approvers.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-[#11141c] border-white/10 text-white hover:bg-white/5 h-10 px-4 rounded-lg">
            <BarChart2 className="w-4 h-4 mr-2 text-[#8a94a6]" />
            Department Overview
          </Button>
          <Button className="bg-[#5e6ad2] hover:bg-[#4f5abf] text-white shadow-lg shadow-indigo-500/20 font-semibold h-10 px-5 rounded-lg border-0 transition-all">
            <Plus className="w-4 h-4 mr-2" />
            Add Department
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar */}
        <div className="w-full lg:w-[320px] flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Departments</h2>
            <span className="bg-white/10 text-[#8a94a6] text-[10px] px-2 py-0.5 rounded-full font-medium">{departments.length}</span>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8a94a6]" />
            <Input 
              placeholder="Search departments..." 
              className="pl-9 bg-[#11141c] border-white/5 text-sm h-10 focus-visible:ring-indigo-500/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            {filteredDepts.map((dept: Department) => {
              const isActive = activeDept.id === dept.id;
              // Provide some unique icon colors dynamically based on id for aesthetics
              const iconColors: Record<string, string> = {
                manager: "text-blue-400",
                it: "text-purple-400",
                admin: "text-emerald-400",
                finance: "text-yellow-400",
                procurement: "text-cyan-400",
                infosec: "text-red-400",
                hr: "text-pink-400",
                facilities: "text-orange-400"
              };
              const colorClass = iconColors[dept.id] || "text-[#8a94a6]";

              return (
                <button
                  key={dept.id}
                  onClick={() => handleDeptSelect(dept)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all ${
                    isActive 
                      ? "bg-[#171b26] border border-white/10" 
                      : "border border-transparent hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-[#0b0e14] border border-white/5 shadow-inner`}>
                      <Activity className={`w-4 h-4 ${colorClass}`} />
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-medium ${isActive ? "text-white" : "text-[#cbd5e1]"}`}>{dept.label}</p>
                      <p className="text-xs text-[#8a94a6]">{dept.slaHours}h SLA</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                      <span className={`text-[10px] font-medium ${isActive ? "text-[#10b981]" : "text-[#8a94a6]"}`}>Active</span>
                    </div>
                    <span className="text-[#8a94a6] opacity-50">›</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Detail Panel */}
        <div className="flex-1 bg-[#11141c] border border-white/5 rounded-2xl p-6 lg:p-8 relative overflow-hidden">
          {/* Subtle glow effect behind header */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />

          <div className="flex items-start justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-white">{activeDept.label}</h2>
                  <span className="bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 text-[10px] px-2 py-0.5 rounded-full font-medium">Active</span>
                </div>
                <p className="text-sm text-[#8a94a6]">Configure SLA and default assignees for this department.</p>
              </div>
            </div>
            <Button variant="outline" className="bg-transparent border-white/10 text-[#cbd5e1] hover:text-white hover:bg-white/5 h-9 text-xs">
              <Edit2 className="w-3.5 h-3.5 mr-2" />
              Edit Details
            </Button>
          </div>

          <div className="space-y-8 relative z-10">
            {/* SLA Configuration row */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">SLA Configuration</h3>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[#8a94a6] text-xs">SLA Target (Hours)</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        className="bg-[#0b0e14] border-white/10 text-white h-11 w-full max-w-[200px]"
                        value={formData.slaHours}
                        onChange={(e) => setFormData({ ...formData, slaHours: e.target.value })}
                      />
                      <span className="text-sm text-[#8a94a6]">hours</span>
                    </div>
                    <p className="text-xs text-[#8a94a6]">Target time allowed for this department to review and process exit cases.</p>
                  </div>
                </div>
                <div className="flex-1 bg-[#0b0e14] border border-white/5 rounded-xl p-5 relative overflow-hidden group">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs text-[#8a94a6] font-medium">SLA Target</span>
                  </div>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-4xl font-bold text-white">{formData.slaHours || 0}</span>
                    <span className="text-xl text-white/50 mb-1">h</span>
                  </div>
                  <p className="text-[10px] text-[#8a94a6]">Time to process cases</p>
                  
                  {/* Decorative waveform */}
                  <div className="absolute bottom-0 left-0 right-0 h-8 opacity-30">
                    <svg viewBox="0 0 200 40" className="w-full h-full stroke-indigo-500 fill-none" preserveAspectRatio="none">
                      <path d="M0 20 Q 20 5, 40 20 T 80 20 T 120 20 T 160 20 T 200 20" strokeWidth="2"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-white/5" />

            {/* Assignee row */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <Label className="text-white text-sm">Default Assignee / Approver Group</Label>
                  <span className="bg-indigo-500/20 text-indigo-400 text-[10px] px-2 py-0.5 rounded-full font-medium border border-indigo-500/20">Recommended</span>
                </div>
                <Select value={formData.assignee} onValueChange={(val) => setFormData({ ...formData, assignee: val })}>
                  <SelectTrigger className="bg-[#0b0e14] border-white/10 text-white h-11">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#11141c] border-white/10 text-white">
                    <SelectItem value="unassigned" className="focus:bg-[#171b26] focus:text-white">Unassigned</SelectItem>
                    {assignees.map((u: any) => (
                      <SelectItem key={u.id} value={u.id} className="focus:bg-[#171b26] focus:text-white">
                        {u.name} ({u.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-[#8a94a6]">This group will receive cases by default for this department.</p>
              </div>
              <div className="flex-1 flex items-center">
                <div className="bg-[#0b0e14] border border-white/5 rounded-xl p-4 w-full flex items-center justify-between cursor-pointer hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#171b26] flex items-center justify-center">
                      <Users className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">6 Members</p>
                      <p className="text-xs text-[#8a94a6]">View group members</p>
                    </div>
                  </div>
                  <span className="text-[#8a94a6]">›</span>
                </div>
              </div>
            </div>

            <hr className="border-white/5" />

            {/* Mandatory Clearance */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Mandatory Clearance</h3>
                  <p className="text-xs text-[#8a94a6] mt-1">Enable to require clearance from this department before final approval.</p>
                </div>
                <Switch
                  checked={formData.mandatory}
                  onCheckedChange={(val) => setFormData({ ...formData, mandatory: val })}
                  disabled={["manager", "hr", "it"].includes(activeDept.id)}
                  className="data-[state=checked]:bg-indigo-500"
                />
              </div>
              <div className="bg-[#171b26]/50 border border-indigo-500/20 rounded-xl p-4 flex gap-3">
                <Info className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-indigo-100 font-medium mb-1">Information</p>
                  <p className="text-xs text-[#8a94a6] leading-relaxed">When mandatory clearance is enabled, the final relieving letter will be issued only after this department approves the case.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 mt-8">
              <Button variant="ghost" className="text-[#cbd5e1] hover:text-white hover:bg-white/5 h-10 px-5" onClick={() => window.location.href = '/settings'}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isUpdating} className="bg-[#5e6ad2] hover:bg-[#4f5abf] text-white shadow-lg shadow-indigo-500/20 h-10 px-6 rounded-lg font-medium border-0 transition-all">
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
