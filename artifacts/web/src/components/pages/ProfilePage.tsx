"use client";

import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Mail, Hash, ChevronRight, Save, Pencil, Building2, User } from "lucide-react";
import { toast } from "sonner";
import { useUserProfile, useUpdateProfile, useManagers } from "@/hooks/api/useProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import {
  SectionCard, ProfileSkeleton,
  EmployeeProfileSection,
  ManagerProfileSection,
  HRProfileSection,
  ApproverProfileSection,
  AdminProfileSection,
} from "@/components/profile/ProfileSections";

export default function ProfilePage() {
  const { user, isHR, isAdmin, isManager, isDeptApprover } = useAuth();
  const canEditManager = isHR || isAdmin;

  const { data: profile, isLoading, error } = useUserProfile();
  const { data: managers } = useManagers();
  const updateProfile = useUpdateProfile();

  // ── Personal fields (all roles) ────────────────────────────────────────────
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  // ── Employment fields (shared) ─────────────────────────────────────────────
  const [jobTitle, setJobTitle] = useState("");
  const [employeeType, setEmployeeType] = useState("");
  const [managerId, setManagerId] = useState("");
  const [dateOfHire, setDateOfHire] = useState<Date | undefined>(undefined);
  const [dept, setDept] = useState("");

  useEffect(() => {
    if (profile) {
      setFirstName(profile.user.firstName || "");
      setLastName(profile.user.lastName || "");
      setPhone(profile.user.phone || "");
      setJobTitle(profile.employment.jobTitle || "");
      setEmployeeType(profile.employment.employeeType || "");
      setManagerId(profile.employment.managerId || "");
      setDept(profile.employment.dept || user?.dept || "");
      setDateOfHire(profile.employment.dateOfHire ? new Date(profile.employment.dateOfHire) : undefined);
    }
  }, [profile, user]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    const file = e.target.files[0];

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB.");
      return;
    }

    setUploadingAvatar(true);
    const toastId = toast.loading("Uploading avatar...");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/profile/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Failed to upload avatar to server");
      }

      const { publicUrl } = await response.json();

      await updateProfile.mutateAsync({
        firstName,
        lastName,
        phone,
        jobTitle,
        employeeType,
        dateOfHire: dateOfHire ? dateOfHire.toISOString() : undefined,
        managerId: managerId || undefined,
        dept: dept || undefined,
        avatarUrl: publicUrl,
      });

      toast.success("Avatar updated successfully", { id: toastId });
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      toast.error(err.message || "Failed to upload avatar", { id: toastId });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
      managerId: managerId || undefined,
      dept: dept || undefined,
    }, {
      onSuccess: () => toast.success("Profile updated successfully"),
      onError: (err: any) => toast.error(err.message || "Failed to update profile"),
    });
  };

  const calculateCompletion = () => {
    if (!profile) return 0;
    const role = profile.employment.role;

    // Role-specific completion fields
    const baseFields = [profile.user.phone, profile.user.avatarUrl, profile.employment.jobTitle];

    const roleFields: Record<string, (string | null | undefined)[]> = {
      employee: [...baseFields, profile.employment.managerId, profile.employment.dateOfHire],
      manager: [...baseFields, profile.employment.dept, profile.employment.dateOfHire],
      hr: [...baseFields, profile.employment.dateOfHire],
      dept_approver: [...baseFields],
      admin: [...baseFields],
    };

    const fields = roleFields[role] ?? baseFields;
    const filled = fields.filter(f => f && String(f).trim() !== "").length;
    return Math.round((filled / fields.length) * 100);
  };

  const completionScore = calculateCompletion();
  const displayRole = profile?.employment.role || user?.role || "employee";

  const ROLE_LABELS: Record<string, string> = {
    employee: "Employee",
    manager: "Manager",
    hr: "HR Professional",
    dept_approver: "Dept Approver",
    admin: "Administrator",
  };

  const ROLE_COLORS: Record<string, string> = {
    employee: "text-blue-400",
    manager: "text-violet-400",
    hr: "text-rose-400",
    dept_approver: "text-teal-400",
    admin: "text-amber-400",
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">My Profile</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {ROLE_LABELS[displayRole] || "Employee"} profile — manage your personal and role-specific information.
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={updateProfile.isPending || isLoading}
              className="h-9 px-4 rounded-xl text-xs font-bold bg-primary shadow-md shadow-primary/20 gap-1.5 shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-6">

            {/* Personal Details — All Roles */}
            <SectionCard
              icon={User}
              iconBg="bg-indigo-500/10"
              iconColor="text-indigo-500"
              title="Personal Details"
              subtitle="Your identity information."
              loading={isLoading}
            >
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
            </SectionCard>

            {/* Role-Specific Sections */}
            {displayRole === "employee" && (
              <EmployeeProfileSection
                profile={profile}
                jobTitle={jobTitle} setJobTitle={setJobTitle}
                employeeType={employeeType} setEmployeeType={setEmployeeType}
                managerId={managerId} setManagerId={setManagerId}
                dateOfHire={dateOfHire} setDateOfHire={setDateOfHire}
                managers={managers}
                canEditManager={canEditManager}
                loading={isLoading}
              />
            )}

            {displayRole === "manager" && (
              <ManagerProfileSection
                profile={profile}
                dept={dept} setDept={setDept}
                jobTitle={jobTitle} setJobTitle={setJobTitle}
                employeeType={employeeType} setEmployeeType={setEmployeeType}
                dateOfHire={dateOfHire} setDateOfHire={setDateOfHire}
                loading={isLoading}
              />
            )}

            {displayRole === "hr" && (
              <HRProfileSection
                profile={profile}
                jobTitle={jobTitle} setJobTitle={setJobTitle}
                employeeType={employeeType} setEmployeeType={setEmployeeType}
                dateOfHire={dateOfHire} setDateOfHire={setDateOfHire}
                loading={isLoading}
              />
            )}

            {displayRole === "dept_approver" && (
              <ApproverProfileSection
                profile={profile}
                jobTitle={jobTitle} setJobTitle={setJobTitle}
                loading={isLoading}
              />
            )}

            {displayRole === "admin" && (
              <AdminProfileSection
                profile={profile}
                jobTitle={jobTitle} setJobTitle={setJobTitle}
                loading={isLoading}
              />
            )}

          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">

            {/* Avatar Card */}
            <Card className="border-border/50 bg-card/60 shadow-soft rounded-2xl py-8 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

              <div className="relative mb-4 z-10">
                {isLoading ? (
                  <Skeleton className="w-24 h-24 rounded-full" />
                ) : (
                  <>
                    <UserAvatar name={profile?.user.firstName || "User"} src={profile?.user.avatarUrl} className="w-24 h-24 text-2xl font-bold shadow-md" />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={handleAvatarClick}
                      disabled={uploadingAvatar}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-background border border-border rounded-full flex items-center justify-center hover:bg-muted disabled:opacity-50 transition-colors shadow-sm"
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
                  <p className={`text-xs font-bold mt-1 uppercase tracking-wider ${ROLE_COLORS[displayRole] || "text-muted-foreground"}`}>
                    {ROLE_LABELS[displayRole] || displayRole}
                  </p>
                  {profile?.employment.jobTitle && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{profile.employment.jobTitle}</p>
                  )}
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

            {/* Organization Context */}
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
                    <p className={`text-xs font-semibold capitalize ${ROLE_COLORS[displayRole] || ""}`}>{ROLE_LABELS[displayRole] || displayRole}</p>
                  </div>
                  {profile?.employment.dept && (
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Department</p>
                      <p className="text-xs font-semibold text-foreground">{profile.employment.dept}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Profile Completeness */}
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
                    {displayRole === "manager"
                      ? "Set your department to start seeing your team's exit cases in the dashboard."
                      : "Complete your profile to help colleagues connect with you better."}
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
