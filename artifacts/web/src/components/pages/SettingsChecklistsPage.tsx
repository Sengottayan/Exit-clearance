import { useState, useEffect } from "react";
import { Redirect } from "@/lib/wouter";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { DEPARTMENTS } from "@/lib/constants";
import { DeptId } from "@/lib/types";
import { Plus, Trash2, Search, Upload, Eye, MoreVertical, Calendar, CheckSquare, GripVertical, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useChecklists, useUpdateChecklist } from "@/hooks/api/useChecklists";
import { format } from "date-fns";
import { GlobalLoading } from "@/components/shared/GlobalLoading";

export default function SettingsChecklistsPage() {
  const { isAdmin } = useAuth();
  const [activeDeptId, setActiveDeptId] = useState<DeptId>(DEPARTMENTS[1].id);
  const [search, setSearch] = useState("");
  
  const { data: dbItems, isLoading } = useChecklists(activeDeptId);
  const { mutate: updateChecklist, isPending: isUpdating } = useUpdateChecklist();
  
  // Local state for edits
  const [items, setItems] = useState<any[]>([]);

  // Sync dbItems to local state
  useEffect(() => {
    if (!dbItems) return;
    
    // Map DB snake_case to camelCase for local use
    const mapped = dbItems.map((i: any) => ({
      id: i.id,
      label: i.label,
      isMandatory: i.is_mandatory,
      hasInput: i.has_input,
      inputLabel: i.input_label
    }));
    setItems(mapped);
  }, [dbItems]);

  if (isLoading) return <GlobalLoading />;
  if (!isAdmin) return <Redirect to="/dashboard" />;

  const activeDept = DEPARTMENTS.find((d) => d.id === activeDeptId)!;

  const updateItem = (itemId: string, updates: any) => {
    setItems(items.map((i) => (i.id === itemId ? { ...i, ...updates } : i)));
  };

  const addItem = () => {
    const newItem = {
      id: `${activeDeptId}-${Date.now()}`,
      label: "New checklist item",
      isMandatory: true,
      hasInput: false,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter((i) => i.id !== itemId));
  };

  const handleSave = () => {
    updateChecklist({ deptId: activeDeptId, items }, {
      onSuccess: () => {
        toast.success(`${activeDept.label} checklist saved`);
      },
      onError: (err: any) => {
        toast.error(`Failed to save: ${err.message}`);
      }
    });
  };

  const mandatoryCount = items.filter(i => i.isMandatory).length;
  const requiresInputCount = items.filter(i => i.hasInput).length;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6 md:p-8 font-sans animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#8a94a6] text-sm mb-1">
            <span className="hover:text-white cursor-pointer transition-colors">Settings</span>
            <span>›</span>
            <span className="text-white font-medium">Checklists</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Checklist Templates</h1>
          <p className="text-[#8a94a6] text-sm font-medium">Create and manage clearance checklist templates used across departments.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-[#11141c] border-white/10 text-white hover:bg-white/5 h-10 px-4 rounded-lg">
            <Upload className="w-4 h-4 mr-2 text-[#8a94a6]" />
            Import Checklist
          </Button>
          <Button className="bg-[#5e6ad2] hover:bg-[#4f5abf] text-white shadow-lg shadow-indigo-500/20 font-semibold h-10 px-5 rounded-lg border-0 transition-all">
            <Plus className="w-4 h-4 mr-2" />
            New Checklist Template
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar */}
        <div className="w-full lg:w-[320px] flex-shrink-0">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">Departments</h2>
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
            {DEPARTMENTS.filter(d => d.id !== "manager" && d.label.toLowerCase().includes(search.toLowerCase())).map((dept) => {
              const isActive = activeDeptId === dept.id;
              
              // We don't have all counts, so we only show the count for the active department
              // or just don't show the subtitle to avoid confusion.
              const itemCount = isActive ? items.length : null;

              const iconColors: Record<string, string> = {
                it: "text-blue-400",
                admin: "text-blue-400",
                finance: "text-emerald-400",
                procurement: "text-orange-400",
                infosec: "text-indigo-400",
                hr: "text-pink-400",
                facilities: "text-yellow-400"
              };
              const colorClass = iconColors[dept.id] || "text-[#8a94a6]";

              return (
                <button
                  key={dept.id}
                  onClick={() => setActiveDeptId(dept.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all ${
                    isActive 
                      ? "bg-[#171b26] border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]" 
                      : "border border-transparent hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-[#0b0e14] border border-white/5 shadow-inner`}>
                      <CheckSquare className={`w-4 h-4 ${colorClass}`} />
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-medium ${isActive ? "text-white" : "text-[#cbd5e1]"}`}>{dept.label}</p>
                      {itemCount !== null && <p className="text-xs text-[#8a94a6]">{itemCount} items</p>}
                    </div>
                  </div>
                  <span className="text-[#8a94a6] opacity-50">›</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Detail Panel */}
        <div className="flex-1 bg-[#11141c] border border-white/5 rounded-2xl p-6 lg:p-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-white">{activeDept.label} Checklist Template</h2>
                  <span className="bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 text-[10px] px-2 py-0.5 rounded-full font-medium">Active</span>
                </div>
                <p className="text-sm text-[#8a94a6]">Edit checklist items and requirements for the {activeDept.label} department.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="bg-transparent border-white/10 text-[#cbd5e1] hover:text-white hover:bg-white/5 h-9 px-3">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" size="icon" className="bg-transparent border-white/10 text-[#cbd5e1] hover:text-white hover:bg-white/5 h-9 w-9">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#0b0e14] border border-white/5 rounded-xl p-5 flex flex-col justify-center">
              <span className="text-3xl font-bold text-white mb-1">{items.length}</span>
              <span className="text-xs text-[#8a94a6] font-medium">Total Items</span>
            </div>
            <div className="bg-[#0b0e14] border border-white/5 rounded-xl p-5 flex flex-col justify-center">
              <span className="text-3xl font-bold text-white mb-1">{mandatoryCount}</span>
              <span className="text-xs text-[#8a94a6] font-medium">Mandatory</span>
            </div>
            <div className="bg-[#0b0e14] border border-white/5 rounded-xl p-5 flex flex-col justify-center">
              <span className="text-3xl font-bold text-white mb-1">{requiresInputCount}</span>
              <span className="text-xs text-[#8a94a6] font-medium">Requires Input</span>
            </div>
            <div className="bg-[#0b0e14] border border-white/5 rounded-xl p-5 flex flex-col justify-center relative">
              <span className="text-xs text-[#8a94a6] font-medium mb-1">Last Updated</span>
              <span className="text-sm font-semibold text-white mb-1">{format(new Date(), "dd MMM yyyy, hh:mm a")}</span>
              <span className="text-xs text-[#8a94a6]">by System Admin</span>
              <Calendar className="absolute top-5 right-5 w-5 h-5 text-indigo-400/30" />
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-[#8a94a6] pb-3 border-b border-white/5 uppercase tracking-wider px-2">
            <div className="col-span-1">Order</div>
            <div className="col-span-5">Checklist Item</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Input Type</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div className="mt-3 space-y-2 mb-6">
            {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-center bg-[#0b0e14] border border-white/5 rounded-lg p-3 hover:bg-white/[0.02] transition-colors group">
                  <div className="col-span-1 flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-[#8a94a6] opacity-50 cursor-grab" />
                    <div className="w-6 h-6 rounded-full bg-[#11141c] flex items-center justify-center text-xs font-medium text-[#8a94a6]">
                      {index + 1}
                    </div>
                  </div>
                  <div className="col-span-5">
                    <Input 
                      className="bg-transparent border-transparent hover:border-white/10 focus:bg-[#11141c] text-sm text-white h-8 px-2 w-full"
                      value={item.label}
                      onChange={(e) => updateItem(item.id, { label: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <button 
                      onClick={() => updateItem(item.id, { isMandatory: !item.isMandatory })}
                      className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold ${
                        item.isMandatory 
                          ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20" 
                          : "bg-white/5 text-[#8a94a6] border border-white/10"
                      }`}
                    >
                      {item.isMandatory ? "Mandatory" : "Optional"}
                    </button>
                  </div>
                  <div className="col-span-2 text-sm text-[#cbd5e1] flex items-center">
                    <button 
                      onClick={() => updateItem(item.id, { hasInput: !item.hasInput })}
                      className="hover:text-white"
                    >
                      {item.hasInput ? "Text Input" : "Yes / No"}
                    </button>
                  </div>
                  <div className="col-span-1 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                    <span className="text-xs text-[#10b981] font-medium">Active</span>
                  </div>
                  <div className="col-span-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8a94a6] hover:text-white hover:bg-white/5">
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => removeItem(item.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

          {/* Add Item Button */}
          <button 
            onClick={addItem}
            className="w-full flex items-center justify-center gap-2 py-4 border border-dashed border-indigo-500/30 rounded-xl text-indigo-400 hover:bg-indigo-500/5 hover:border-indigo-500/50 transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Checklist Item
          </button>

          {/* Bottom Actions */}
          <div className="flex justify-end gap-3 mt-8">
            <Button variant="ghost" className="text-[#cbd5e1] hover:text-white hover:bg-white/5 h-10 px-5">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isUpdating} className="bg-[#5e6ad2] hover:bg-[#4f5abf] text-white shadow-lg shadow-indigo-500/20 h-10 px-6 rounded-lg font-medium border-0 transition-all">
              {isUpdating ? "Saving..." : "Save Checklist"}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
