import { useAuth } from "@/hooks/useAuth";
import { Redirect, Link } from "@/lib/wouter";
import { useWorkflows, useUpdateWorkflow } from "@/hooks/api/useWorkflows";
import { useDepartments } from "@/hooks/api/useDepartments";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, Plus, Layers, Briefcase, Star, GraduationCap, Settings as SettingsIcon, Edit2, Info, Clock, AlertTriangle, ShieldCheck, Users, Activity } from "lucide-react";
import { format } from "date-fns";
import { GlobalLoading } from "@/components/shared/GlobalLoading";

export default function SettingsWorkflowsPage() {
  const { isAdmin } = useAuth();
  const { data, isLoading } = useWorkflows();
  const { data: departments = [] } = useDepartments();
  const { mutate: updateWorkflow, isPending: isUpdating } = useUpdateWorkflow();
  
  const [activeTemplate, setActiveTemplate] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    slaTargetHours: 24,
    slaWarningHours: 4,
    escalationHours: 48,
    assignee: "admin_dept",
    mandatory: true,
  });

  const templates = data?.workflows || [];
  const settings = data?.settings || {};

  useEffect(() => {
    if (templates.length > 0 && !activeTemplate) {
      handleTemplateSelect(templates.find((t: any) => t.is_default) || templates[0]);
    }
  }, [templates, activeTemplate]);

  if (!isAdmin) return <Redirect to="/dashboard" />;

  const handleTemplateSelect = (template: any) => {
    setActiveTemplate(template);
    // Calculate SLA target based on multiplier
    const baseHours = 24; // Just a mock base for UI
    setFormData({
      slaTargetHours: Math.round(baseHours * template.sla_multiplier),
      slaWarningHours: settings.sla_warning_hours || 4,
      escalationHours: settings.escalation_hours || 48,
      assignee: "admin_dept",
      mandatory: true,
    });
  };

  const handleSave = () => {
    if (!activeTemplate) return;
    
    // Reverse calc multiplier just for demonstration
    const multiplier = formData.slaTargetHours / 24;

    updateWorkflow({
      id: activeTemplate.id,
      updates: {
        sla_multiplier: multiplier,
        global_settings: {
          sla_warning_hours: formData.slaWarningHours.toString(),
          escalation_hours: formData.escalationHours.toString()
        }
      }
    }, {
      onSuccess: () => {
        toast.success(`Workflow configuration saved successfully`);
      },
      onError: (err: any) => {
        toast.error(`Failed to save: ${err.message}`);
      }
    });
  };

  if (isLoading) return <GlobalLoading />;
  if (!activeTemplate) return null;

  const filteredTemplates = templates.filter((t: any) => 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  // Icon mapping for templates based on standard IDs
  const getTemplateIcon = (id: string, color: string) => {
    switch (id) {
      case 'standard': return <Users2 className={`w-4 h-4 ${color}`} />;
      case 'contractor': return <Briefcase className={`w-4 h-4 ${color}`} />;
      case 'executive': return <Star className={`w-4 h-4 ${color}`} />;
      case 'intern': return <GraduationCap className={`w-4 h-4 ${color}`} />;
      default: return <SettingsIcon className={`w-4 h-4 ${color}`} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6 md:p-8 font-sans animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#8a94a6] text-sm mb-1">
            <span className="hover:text-white cursor-pointer transition-colors">Settings</span>
            <span>›</span>
            <span className="text-white font-medium">Workflows</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Workflow Configuration</h1>
          <p className="text-[#8a94a6] text-sm font-medium">Configure exit workflows, SLA settings, and clearance order for your organization.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-[#11141c] border-white/10 text-white hover:bg-white/5 h-10 px-4 rounded-lg">
            <Layers className="w-4 h-4 mr-2 text-[#8a94a6]" />
            Workflow Overview
          </Button>
          <Button className="bg-[#5e6ad2] hover:bg-[#4f5abf] text-white shadow-lg shadow-indigo-500/20 font-semibold h-10 px-5 rounded-lg border-0 transition-all">
            <Plus className="w-4 h-4 mr-2" />
            New Workflow Template
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar */}
        <div className="w-full lg:w-[340px] flex-shrink-0">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-white">Workflow Templates</h2>
            <p className="text-xs text-[#8a94a6] mt-1">Pre-configured exit workflows for different employee types.</p>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8a94a6]" />
            <Input 
              placeholder="Search templates..." 
              className="pl-9 bg-[#11141c] border-white/5 text-sm h-10 focus-visible:ring-indigo-500/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            {filteredTemplates.map((template: any) => {
              const isActive = activeTemplate.id === template.id;
              
              const iconColors: Record<string, string> = {
                standard: "text-indigo-400",
                contractor: "text-orange-400",
                executive: "text-blue-400",
                intern: "text-emerald-400",
              };
              const colorClass = iconColors[template.id] || "text-[#8a94a6]";

              return (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                    isActive 
                      ? "bg-[#171b26] border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]" 
                      : "border border-transparent hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-[#0b0e14] border border-white/5 shadow-inner flex-shrink-0`}>
                      {template.id === 'standard' && <Users className={`w-5 h-5 ${colorClass}`} />}
                      {template.id === 'contractor' && <Briefcase className={`w-5 h-5 ${colorClass}`} />}
                      {template.id === 'executive' && <Star className={`w-5 h-5 ${colorClass}`} />}
                      {template.id === 'intern' && <GraduationCap className={`w-5 h-5 ${colorClass}`} />}
                      {!['standard','contractor','executive','intern'].includes(template.id) && <SettingsIcon className={`w-5 h-5 ${colorClass}`} />}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`text-sm font-semibold ${isActive ? "text-white" : "text-[#cbd5e1]"}`}>{template.name}</p>
                        {template.is_default && (
                          <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Default</span>
                        )}
                        {template.sla_multiplier > 1 && (
                          <span className="text-indigo-400 font-mono text-[10px] font-bold">{template.sla_multiplier}x SLA</span>
                        )}
                      </div>
                      <p className="text-xs text-[#8a94a6] line-clamp-2 leading-relaxed pr-2">{template.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-center h-full gap-2">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      {template.id === 'custom' ? (
                        <span className={`text-[10px] font-medium text-[#8a94a6]`}>Draft</span>
                      ) : (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                          <span className={`text-[10px] font-medium ${isActive ? "text-[#10b981]" : "text-[#8a94a6]"}`}>Active</span>
                        </>
                      )}
                      <span className="text-[#8a94a6] opacity-50 ml-1">›</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Detail Panel */}
        <div className="flex-1 bg-[#11141c] border border-white/5 rounded-2xl p-6 lg:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-white">{activeTemplate.name}</h2>
                  <span className="bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 text-[10px] px-2 py-0.5 rounded-full font-medium">Active</span>
                </div>
                <p className="text-sm text-[#8a94a6]">{activeTemplate.description}</p>
              </div>
            </div>
            <Button variant="outline" className="bg-transparent border-white/10 text-[#cbd5e1] hover:text-white hover:bg-white/5 h-9 text-xs">
              <Edit2 className="w-3.5 h-3.5 mr-2" />
              Edit Template
            </Button>
          </div>

          <Tabs defaultValue="sla" className="w-full">
            <TabsList className="bg-transparent border-b border-white/10 w-full justify-start rounded-none h-auto p-0 mb-6 gap-6">
              <TabsTrigger value="sla" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none px-0 py-3 text-sm data-[state=active]:text-white text-[#8a94a6]">SLA & Approvals</TabsTrigger>
              <TabsTrigger value="order" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none px-0 py-3 text-sm data-[state=active]:text-white text-[#8a94a6]">Clearance Order</TabsTrigger>
              <TabsTrigger value="depts" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none px-0 py-3 text-sm data-[state=active]:text-white text-[#8a94a6]">Applicable Departments</TabsTrigger>
              <TabsTrigger value="log" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none px-0 py-3 text-sm data-[state=active]:text-white text-[#8a94a6]">Activity Log</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sla" className="space-y-8 outline-none">
              
              <div className="flex flex-col lg:flex-row gap-8">
                {/* SLA Configuration Form */}
                <div className="w-full lg:w-1/2 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-4 h-4 text-[#8a94a6]" />
                      <h3 className="text-sm font-semibold text-white">SLA Configuration</h3>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[#8a94a6] text-xs">SLA Target (Hours)</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          className="bg-[#0b0e14] border-white/10 text-white h-11 w-full"
                          value={formData.slaTargetHours}
                          onChange={(e) => setFormData({ ...formData, slaTargetHours: parseInt(e.target.value) || 0 })}
                        />
                        <span className="text-sm text-[#8a94a6]">hours</span>
                      </div>
                      <p className="text-xs text-[#8a94a6]">Target time allowed to complete all clearance steps for this workflow.</p>
                    </div>
                  </div>

                  <hr className="border-white/5" />

                  <div className="space-y-3">
                    <Label className="text-white text-sm">Default Assignee / Approver Group</Label>
                    <Select value={formData.assignee} onValueChange={(val) => setFormData({ ...formData, assignee: val })}>
                      <SelectTrigger className="bg-[#0b0e14] border-white/10 text-white h-11">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#11141c] border-white/10 text-white">
                        <SelectItem value="admin_dept" className="focus:bg-[#171b26] focus:text-white">Admin Dept (dept_approver)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-[#8a94a6]">This group will receive cases by default.</p>
                  </div>

                  <hr className="border-white/5" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-white">Mandatory Clearance</h3>
                        <p className="text-xs text-[#8a94a6] mt-1">Enable to require clearance completion before final relieving letter approval.</p>
                      </div>
                      <Switch
                        checked={formData.mandatory}
                        onCheckedChange={(val) => setFormData({ ...formData, mandatory: val })}
                        className="data-[state=checked]:bg-indigo-500"
                      />
                    </div>
                    <div className="bg-[#171b26]/50 border border-indigo-500/20 rounded-xl p-4 flex gap-3">
                      <Info className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-indigo-100 font-medium mb-1">Note</p>
                        <p className="text-xs text-[#8a94a6] leading-relaxed">Mandatory clearance ensures all tasks are completed before the employee is fully offboarded.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side Stats & Summary */}
                <div className="w-full lg:w-1/2 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldCheck className="w-4 h-4 text-[#8a94a6]" />
                      <h3 className="text-sm font-semibold text-white">SLA Target Overview</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-[#0b0e14] border border-white/5 rounded-xl p-4 flex flex-col justify-between h-[100px]">
                        <span className="text-[10px] text-[#8a94a6] uppercase tracking-wider font-semibold">Target Time</span>
                        <div>
                          <p className="text-2xl font-bold text-white mb-1">{formData.slaTargetHours}h</p>
                          <p className="text-[10px] text-[#8a94a6]">To complete all tasks</p>
                        </div>
                      </div>
                      
                      <div className="bg-[#0b0e14] border border-amber-500/10 rounded-xl p-4 flex flex-col justify-between h-[100px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 blur-xl rounded-full" />
                        <span className="text-[10px] text-amber-500/70 uppercase tracking-wider font-semibold relative z-10">Warning Before</span>
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-1">
                            <Input 
                              type="number" 
                              className="w-12 h-7 bg-transparent border-amber-500/20 text-amber-500 font-bold px-1 text-xl" 
                              value={formData.slaWarningHours}
                              onChange={e => setFormData({...formData, slaWarningHours: parseInt(e.target.value) || 0})}
                            />
                            <span className="text-xl font-bold text-amber-500">h</span>
                          </div>
                          <p className="text-[10px] text-[#8a94a6]">Before SLA breach</p>
                        </div>
                      </div>

                      <div className="bg-[#0b0e14] border border-red-500/10 rounded-xl p-4 flex flex-col justify-between h-[100px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 blur-xl rounded-full" />
                        <span className="text-[10px] text-red-500/70 uppercase tracking-wider font-semibold relative z-10">Auto-escalation</span>
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-1">
                            <Input 
                              type="number" 
                              className="w-12 h-7 bg-transparent border-red-500/20 text-red-500 font-bold px-1 text-xl" 
                              value={formData.escalationHours}
                              onChange={e => setFormData({...formData, escalationHours: parseInt(e.target.value) || 0})}
                            />
                            <span className="text-xl font-bold text-red-500">h</span>
                          </div>
                          <p className="text-[10px] text-[#8a94a6]">After SLA breach</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <h3 className="text-sm font-semibold text-white mb-4">Workflow Summary</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm py-1 border-b border-white/5">
                        <span className="text-[#8a94a6] flex items-center gap-2"><Layers className="w-3.5 h-3.5" /> Template Type</span>
                        <span className="text-white font-medium">{activeTemplate.is_default ? "Default" : "Custom"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm py-1 border-b border-white/5">
                        <span className="text-[#8a94a6] flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Designed For</span>
                        <span className="text-white font-medium">{activeTemplate.name} Employees</span>
                      </div>
                      <div className="flex items-center justify-between text-sm py-1 border-b border-white/5">
                        <span className="text-[#8a94a6] flex items-center gap-2"><Activity className="w-3.5 h-3.5" /> Total Steps</span>
                        <span className="text-white font-medium">{activeTemplate.dept_ids?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm py-1 border-b border-white/5">
                        <span className="text-[#8a94a6] flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> Active Departments</span>
                        <span className="text-white font-medium">{departments.filter(d => activeTemplate.dept_ids.includes(d.id)).length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm py-1 border-b border-white/5">
                        <span className="text-[#8a94a6] flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Created By</span>
                        <span className="text-white font-medium">System Admin</span>
                      </div>
                      <div className="flex items-center justify-between text-sm py-1">
                        <span className="text-[#8a94a6] flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Last Updated</span>
                        <span className="text-white font-medium">{format(new Date(activeTemplate.updated_at), "dd MMM yyyy, hh:mm a")}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <div className="pt-6 mt-4 flex justify-end gap-3 border-t border-white/5">
                <Button variant="ghost" className="text-[#cbd5e1] hover:text-white hover:bg-white/5 h-10 px-5">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isUpdating} className="bg-[#5e6ad2] hover:bg-[#4f5abf] text-white shadow-lg shadow-indigo-500/20 h-10 px-6 rounded-lg font-medium border-0 transition-all">
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </div>

            </TabsContent>
            
            <TabsContent value="order" className="text-[#8a94a6] p-8 text-center border border-white/5 rounded-xl bg-white/[0.02]">
              Clearance Order configuration interface will be displayed here.
            </TabsContent>
            
            <TabsContent value="depts" className="text-[#8a94a6] p-8 text-center border border-white/5 rounded-xl bg-white/[0.02]">
              Applicable Departments configuration interface will be displayed here.
            </TabsContent>
            
            <TabsContent value="log" className="text-[#8a94a6] p-8 text-center border border-white/5 rounded-xl bg-white/[0.02]">
              Activity Log interface will be displayed here.
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Simple fallback icon
const Users2 = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
