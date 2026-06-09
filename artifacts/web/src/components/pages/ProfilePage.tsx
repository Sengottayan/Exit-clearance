"use client";

import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Mail, Hash, Info, User, ChevronRight, Save, Calendar as CalendarIcon, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user } = useAuth();
  
  const getDeptByRole = (role: string) => {
    if (!role) return "";
    const r = role.toLowerCase();
    if (r.includes("hr")) return "HR";
    if (r.includes("admin")) return "Administration";
    if (r.includes("it")) return "IT";
    if (r.includes("finance")) return "Finance";
    return user?.dept || "Engineering";
  };

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [reportingTo, setReportingTo] = useState("");
  const [managerName, setManagerName] = useState("");
  const [employeeType, setEmployeeType] = useState("");
  const [dateOfHire, setDateOfHire] = useState<Date | undefined>(undefined);
  
  useEffect(() => {
    if (user) {
      const parts = user.name.split(" ");
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
    }
  }, [user]);

  if (!user) return null;

  const roleDisplay = user.role === "hr" ? "HR" : user.role === "admin" ? "Admin" : user.role === "employee" ? "Employee" : user.role;
  const deptDisplay = getDeptByRole(user.role);

  const handleSave = () => {
    toast.success("Profile updated successfully");
  };

  return (
    <div className="flex gap-6 -mx-4 md:-mx-6 -mt-4 md:-mt-6 min-h-[calc(100vh-4rem)]">
      <div className="flex-1 min-w-0 px-4 md:px-6 pt-4 md:pt-6 pb-8 space-y-5">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
            <span className="hover:text-foreground transition-colors cursor-pointer">Dashboard</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-semibold">My Profile</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">My Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your personal information and account details.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Main Form Area */}
          <div className="lg:col-span-2">
            <Card className="border-border/50 bg-card/60 shadow-soft overflow-hidden rounded-2xl">
              <div className="p-6 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-foreground">Personal Details</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Update your personal and employment information.</p>
                  </div>
                </div>
                <Button onClick={handleSave} className="h-9 px-4 rounded-xl text-xs font-bold bg-primary shadow-md shadow-primary/20 gap-1.5 shrink-0">
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </Button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground/80">Employee ID <span className="text-red-500">*</span></Label>
                    <Input disabled value={user.employeeId || "USER_3ES"} className="h-10 rounded-xl text-xs font-medium bg-background border-border/60 opacity-80" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground/80">First Name <span className="text-red-500">*</span></Label>
                    <Input value={firstName} onChange={e => setFirstName(e.target.value)} className="h-10 rounded-xl text-xs font-medium bg-background border-border/60" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground/80">Last Name <span className="text-red-500">*</span></Label>
                    <Input value={lastName} onChange={e => setLastName(e.target.value)} className="h-10 rounded-xl text-xs font-medium bg-background border-border/60" />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground/80">Email Address <span className="text-red-500">*</span></Label>
                    <Input disabled value={user.email || "sengosaminathan@gmail.com"} className="h-10 rounded-xl text-xs font-medium bg-background border-border/60 opacity-80" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground/80">Phone Number</Label>
                    <Input placeholder="Enter phone number" value={phone} onChange={e => setPhone(e.target.value)} className="h-10 rounded-xl text-xs font-medium bg-background border-border/60" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground/80">Role <span className="text-red-500">*</span></Label>
                    <Select disabled value={roleDisplay}>
                      <SelectTrigger className="h-10 rounded-xl text-xs font-medium bg-background border-border/60 opacity-80 disabled:opacity-80">
                        <SelectValue placeholder={roleDisplay} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={roleDisplay}>{roleDisplay}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground/80">Department</Label>
                    <Select disabled value={deptDisplay}>
                      <SelectTrigger className="h-10 rounded-xl text-xs font-medium bg-background border-border/60 opacity-80 disabled:opacity-80">
                        <SelectValue placeholder={deptDisplay} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={deptDisplay}>{deptDisplay}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground/80">Job Title</Label>
                    <Input placeholder="Enter job title" value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="h-10 rounded-xl text-xs font-medium bg-background border-border/60" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground/80">Reporting To (Manager)</Label>
                    <Select value={reportingTo} onValueChange={setReportingTo}>
                      <SelectTrigger className="h-10 rounded-xl text-xs font-medium bg-background border-border/60">
                        <SelectValue placeholder="Select manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rahul_mehta">Rahul Mehta</SelectItem>
                        <SelectItem value="priya_sharma">Priya Sharma</SelectItem>
                        <SelectItem value="arjun_nair">Arjun Nair</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 4 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground/80">Manager Name</Label>
                    <Input placeholder="Enter manager name" value={managerName} onChange={e => setManagerName(e.target.value)} className="h-10 rounded-xl text-xs font-medium bg-background border-border/60" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground/80">Employee Type</Label>
                    <Select value={employeeType} onValueChange={setEmployeeType}>
                      <SelectTrigger className="h-10 rounded-xl text-xs font-medium bg-background border-border/60">
                        <SelectValue placeholder="Select employee type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground/80">Date of Hire</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("w-full h-10 justify-start text-left font-medium text-xs rounded-xl border-border/60 bg-background hover:bg-background", !dateOfHire && "text-muted-foreground")}
                        >
                          {dateOfHire ? format(dateOfHire, "PPP") : <span>Select date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateOfHire}
                          onSelect={setDateOfHire}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <p className="text-[11px] text-muted-foreground pt-4 font-medium">* Required fields</p>
              </div>
            </Card>
          </div>

          {/* Right Sidebar Cards */}
          <div className="space-y-6">
            <Card className="border-border/50 bg-card/60 shadow-soft rounded-2xl py-8 flex flex-col items-center justify-center">
              <div className="relative mb-5">
                <UserAvatar name={user.name} className="w-24 h-24 text-2xl font-bold bg-pink-500 text-white shadow-md" />
                <button className="absolute bottom-0 right-0 w-7 h-7 bg-card border border-border rounded-full flex items-center justify-center hover:bg-muted transition-colors shadow-sm">
                  <Pencil className="w-3.5 h-3.5 text-foreground" />
                </button>
              </div>
              <h2 className="text-xl font-extrabold text-foreground tracking-tight">{user.name}</h2>
              <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-wider">{roleDisplay}</p>
              
              <div className="mt-6 space-y-2.5 w-full px-6">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{user.email || "sengosaminathan@gmail.com"}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Hash className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-mono">{user.employeeId || "USER_3ES"}</span>
                </div>
              </div>
            </Card>

            <Card className="border-border/50 bg-card/60 shadow-soft rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                  <Info className="w-3 h-3" />
                </div>
                <h3 className="text-sm font-extrabold text-foreground">Information</h3>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-1.5">
                Ensure your information is up to date. This helps us keep records accurate and improve your experience.
              </p>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
