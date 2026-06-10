"use client";

import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Mail, Hash, Info, User, ChevronRight, Save, Calendar as CalendarIcon, Pencil, Building2, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useUserProfile, useUpdateProfile, useManagers } from "@/hooks/api/useProfile";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { user, isHR, isAdmin } = useAuth();
  const canEditManager = isHR || isAdmin;
  
  const { data: profile, isLoading, error } = useUserProfile();
  const { data: managers } = useManagers();
  const updateProfile = useUpdateProfile();

  // Personal
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  // Employment
  const [jobTitle, setJobTitle] = useState("");
  const [employeeType, setEmployeeType] = useState("");
  const [managerId, setManagerId] = useState("");
  const [dateOfHire, setDateOfHire] = useState<Date | undefined>(undefined);
  
  useEffect(() => {
    if (profile) {
      setFirstName(profile.user.firstName || "");
      setLastName(profile.user.lastName || "");
      setPhone(profile.user.phone || "");
      setJobTitle(profile.employment.jobTitle || "");
      setEmployeeType(profile.employment.employeeType || "");
      setManagerId(profile.employment.managerId || "");
      setDateOfHire(profile.employment.dateOfHire ? new Date(profile.employment.dateOfHire) : undefined);
    }
  }, [profile]);

  if (error) {
    return <div className="p-6 text-red-500">Failed to load profile.</div>;
  }

  const handleSave = () => {
    if (dateOfHire && dateOfHire > new Date()) {
      toast.error("Date of hire cannot be in the future.");
      return;
    }
    if (phone && !/^[0-9+\s-]{7,20}$/.test(phone)) {
      toast.error("Invalid phone number format.");
      return;
    }

    updateProfile.mutate({
      firstName,
      lastName,
      phone,
      jobTitle,
      employeeType,
      dateOfHire: dateOfHire ? dateOfHire.toISOString() : undefined,
      managerId: managerId || undefined
    }, {
      onSuccess: () => {
        toast.success("Profile updated successfully");
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to update profile");
      }
    });
  };

  const calculateCompletion = () => {
    if (!profile) return 0;
    const fields = [
      profile.user.phone,
      profile.user.avatarUrl,
      profile.employment.jobTitle,
      profile.employment.managerId,
      profile.employment.dateOfHire
    ];
    const filled = fields.filter(f => f && String(f).trim() !== "").length;
    return Math.round((filled / fields.length) * 100);
  };

  const completionScore = calculateCompletion();

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
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">My Profile</h1>
            <Button 
              onClick={handleSave} 
              disabled={updateProfile.isPending || isLoading}
              className="h-9 px-4 rounded-xl text-xs font-bold bg-primary shadow-md shadow-primary/20 gap-1.5 shrink-0"
            >
              <Save className="w-3.5 h-3.5" /> 
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Manage your personal information and employment details.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Personal Details */}
            <Card className="border-border/50 bg-card/60 shadow-soft overflow-hidden rounded-2xl">
              <div className="p-5 border-b border-border/40 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-foreground">Personal Details</h2>
                  <p className="text-[11px] text-muted-foreground">Your identity information.</p>
                </div>
              </div>
              <div className="p-5">
                {isLoading ? <ProfileSkeleton rows={2} /> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground/80">First Name <span className="text-red-500">*</span></Label>
                      <Input value={firstName} onChange={e => setFirstName(e.target.value)} className="h-10 rounded-xl text-xs font-medium bg-background border-border/60" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground/80">Last Name <span className="text-red-500">*</span></Label>
                      <Input value={lastName} onChange={e => setLastName(e.target.value)} className="h-10 rounded-xl text-xs font-medium bg-background border-border/60" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground/80">Email Address</Label>
                      <Input disabled value={profile?.user.email || ""} className="h-10 rounded-xl text-xs font-medium bg-background border-border/60 opacity-80" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground/80">Phone Number</Label>
                      <Input placeholder="Enter phone number" value={phone} onChange={e => setPhone(e.target.value)} className="h-10 rounded-xl text-xs font-medium bg-background border-border/60" />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Employment Details */}
            <Card className="border-border/50 bg-card/60 shadow-soft overflow-hidden rounded-2xl">
              <div className="p-5 border-b border-border/40 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-foreground">Employment Details</h2>
                  <p className="text-[11px] text-muted-foreground">Your job and organizational structure.</p>
                </div>
              </div>
              <div className="p-5">
                {isLoading ? <ProfileSkeleton rows={3} /> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground/80">Employee ID</Label>
                      <Input disabled value={profile?.employment.employeeId || ""} className="h-10 rounded-xl text-xs font-medium bg-muted border-border/60 opacity-80 cursor-not-allowed" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground/80">Job Title</Label>
                      <Input placeholder="e.g. Senior Engineer" value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="h-10 rounded-xl text-xs font-medium bg-background border-border/60" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground/80">Manager (Reporting To)</Label>
                      <Select 
                        value={managerId} 
                        onValueChange={setManagerId} 
                        disabled={!canEditManager}
                      >
                        <SelectTrigger className={cn("h-10 rounded-xl text-xs font-medium bg-background border-border/60", !canEditManager && "opacity-80 bg-muted cursor-not-allowed")}>
                          <SelectValue placeholder="Select manager" />
                        </SelectTrigger>
                        <SelectContent>
                          {managers?.map(m => (
                            <SelectItem key={m.memberId} value={m.memberId}>
                              {m.name} ({m.jobTitle})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!canEditManager && <p className="text-[10px] text-muted-foreground mt-1">Contact HR to change manager.</p>}
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
                          <SelectItem value="intern">Intern</SelectItem>
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
                            disabled={(date) => date > new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground/80">Status</Label>
                      <Input disabled value={profile?.employment.employmentStatus.replace('_', ' ').toUpperCase() || "ACTIVE"} className="h-10 rounded-xl text-xs font-bold bg-muted border-border/60 opacity-80 text-green-600 cursor-not-allowed" />
                    </div>
                  </div>
                )}
              </div>
            </Card>

          </div>

          {/* Right Sidebar Cards */}
          <div className="space-y-6">
            <Card className="border-border/50 bg-card/60 shadow-soft rounded-2xl py-8 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
              
              <div className="relative mb-4 z-10">
                {isLoading ? (
                  <Skeleton className="w-24 h-24 rounded-full" />
                ) : (
                  <>
                    <UserAvatar name={profile?.user.firstName || "User"} src={profile?.user.avatarUrl} className="w-24 h-24 text-2xl font-bold shadow-md" />
                    <button 
                      onClick={() => toast.info("Avatar upload coming soon")}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-background border border-border rounded-full flex items-center justify-center hover:bg-muted transition-colors shadow-sm"
                    >
                      <Pencil className="w-3.5 h-3.5 text-foreground" />
                    </button>
                  </>
                )}
              </div>
              
              {isLoading ? (
                <div className="flex flex-col items-center space-y-2 mt-2 z-10">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ) : (
                <div className="flex flex-col items-center z-10">
                  <h2 className="text-xl font-extrabold text-foreground tracking-tight">
                    {profile?.user.firstName} {profile?.user.lastName}
                  </h2>
                  <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-wider">{profile?.employment.jobTitle || profile?.organization.role}</p>
                </div>
              )}
              
              {!isLoading && (
                <div className="mt-6 space-y-2.5 w-full px-6 z-10">
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{profile?.user.email}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Hash className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-mono">{profile?.employment.employeeId}</span>
                  </div>
                </div>
              )}
            </Card>

            <Card className="border-border/50 bg-card/60 shadow-soft rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-extrabold text-foreground">Organization Context</h3>
              </div>
              
              {isLoading ? <ProfileSkeleton rows={2} /> : (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Current Organization</p>
                    <p className="text-xs font-semibold text-foreground">{profile?.organization.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">System Role</p>
                    <p className="text-xs font-semibold text-foreground capitalize">{profile?.organization.role}</p>
                  </div>
                </div>
              )}
            </Card>

            {!isLoading && (
              <Card className="border-border/50 bg-card/60 shadow-soft rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-extrabold text-foreground">Profile Completeness</h3>
                  <span className="text-xs font-bold text-indigo-500">{completionScore}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${completionScore}%` }} />
                </div>
                {completionScore < 100 && (
                  <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                    Complete your profile to help colleagues connect with you better.
                  </p>
                )}
              </Card>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function ProfileSkeleton({ rows }: { rows: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {Array.from({ length: rows * 2 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}
