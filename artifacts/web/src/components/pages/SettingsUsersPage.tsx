import { useState, useMemo } from "react";
import { Redirect } from "@/lib/wouter";
import { useAuth } from "@/hooks/useAuth";
import { useUsers, useUpdateUser, useDeactivateUser } from "@/hooks/api/useUsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Filter, Download, MoreVertical, Users, UserCheck, UserX, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { GlobalLoading } from "@/components/shared/GlobalLoading";
import { OrganizationSwitcher, UserButton, OrganizationProfile } from "@clerk/nextjs";

export default function SettingsUsersPage() {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState<"list" | "clerk">("list");
  
  const { data: dbUsersResp, isLoading } = useUsers({ search, limit: 100 });
  const { mutate: updateUser } = useUpdateUser();
  const { mutate: deactivateUser } = useDeactivateUser();

  const allUsers = useMemo(() => {
    return Array.isArray(dbUsersResp) ? dbUsersResp : (dbUsersResp?.data || []);
  }, [dbUsersResp]);

  // Compute unique departments dynamically
  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>();
    allUsers.forEach((u: any) => {
      if (u.dept) depts.add(u.dept);
    });
    return Array.from(depts).sort();
  }, [allUsers]);

  // Client-side filtering
  const filteredUsers = useMemo(() => {
    let result = [...allUsers];

    // Filter by role
    if (roleFilter !== "all") {
      result = result.filter((u: any) => u.role === roleFilter);
    }

    // Filter by department
    if (deptFilter !== "all") {
      result = result.filter((u: any) => u.dept === deptFilter);
    }

    // Filter by status (mock check since status column doesn't exist yet)
    if (statusFilter !== "all") {
      if (statusFilter === "inactive") return [];
    }

    return result;
  }, [allUsers, roleFilter, deptFilter, statusFilter]);

  const totalUsers = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
  const activePage = Math.min(currentPage, totalPages);

  // Paginated user list
  const pagedUsers = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, activePage, pageSize]);

  const activeUsers = totalUsers;
  const inactiveUsers = 0;
  const lockedAccounts = 0;

  if (!isAdmin) return <Redirect to="/dashboard" />;
  if (isLoading) return <GlobalLoading />;

  const handleRoleChange = (userId: string, newRole: string) => {
    updateUser({ id: userId, updates: { role: newRole } }, {
      onSuccess: () => toast.success("Role updated successfully")
    });
  };

  const handleDeactivate = (userId: string) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;
    deactivateUser(userId, {
      onSuccess: () => toast.success("User deactivated successfully")
    });
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6 md:p-8 font-sans animate-in fade-in duration-500">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#8a94a6] text-sm mb-1">
            <span className="hover:text-white cursor-pointer transition-colors">Settings</span>
            <span>›</span>
            <span className="hover:text-white cursor-pointer transition-colors">Users & Roles</span>
            <span>›</span>
            <span className="text-white font-medium">Users</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">User Management</h1>
          <p className="text-[#8a94a6] text-sm font-medium">Manage system users, their roles, and department access.</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2 border-l border-white/[0.08] pl-3">
            <OrganizationSwitcher
              appearance={{
                elements: {
                  rootBox: "flex items-center justify-center",
                  organizationSwitcherTrigger: "px-2 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors text-zinc-300 text-sm font-medium",
                  organizationPreviewTextContainer: "text-zinc-200",
                  organizationPreviewMainIdentifier: "text-zinc-200 font-medium"
                }
              }}
            />
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-8 h-8"
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-8 border-b border-white/5 px-2 mb-6">
        <button
          onClick={() => setActiveTab("list")}
          className={`pb-4 text-sm font-semibold transition-all relative ${
            activeTab === "list"
              ? "text-indigo-400"
              : "text-[#8a94a6] hover:text-white"
          }`}
        >
          Users Database
          {activeTab === "list" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("clerk")}
          className={`pb-4 text-sm font-semibold transition-all relative ${
            activeTab === "clerk"
              ? "text-indigo-400"
              : "text-[#8a94a6] hover:text-white"
          }`}
        >
          Clerk Member Directory
          {activeTab === "clerk" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
          )}
        </button>
      </div>

      {/* KPI Cards */}
      {activeTab === "list" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#11141c] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-[#8a94a6] font-medium mb-1">Total Users</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-white leading-none">{totalUsers}</p>
              </div>
              <p className="text-xs text-[#8a94a6] mt-1">Active accounts</p>
            </div>
          </div>

          <div className="bg-[#11141c] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-[#8a94a6] font-medium mb-1">Active Users</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-white leading-none">{activeUsers}</p>
              </div>
              <p className="text-xs text-[#8a94a6] mt-1">90.5% of total</p>
            </div>
          </div>

          <div className="bg-[#11141c] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <UserX className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-[#8a94a6] font-medium mb-1">Inactive Users</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-white leading-none">{inactiveUsers}</p>
              </div>
              <p className="text-xs text-[#8a94a6] mt-1">Temporarily disabled</p>
            </div>
          </div>

          <div className="bg-[#11141c] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-[#8a94a6] font-medium mb-1">Locked Accounts</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-white leading-none">{lockedAccounts}</p>
              </div>
              <p className="text-xs text-[#8a94a6] mt-1">No locked accounts</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === "list" ? (
        <div className="bg-[#11141c] border border-white/5 rounded-2xl flex flex-col">
          
          {/* Filters Bar */}
          <div className="p-4 border-b border-white/5 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-[300px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8a94a6]" />
                <Input 
                  placeholder="Search users by name, email, or employee ID..." 
                  className="pl-9 bg-[#0b0e14] border-white/5 text-sm h-10 w-full focus-visible:ring-indigo-500/50 text-white rounded-lg"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="bg-[#0b0e14] border-white/5 text-[#8a94a6] hover:text-white h-10 w-10 shrink-0 rounded-lg">
                <Filter className="w-4 h-4" />
              </Button>
              
              <Select value={roleFilter} onValueChange={(val) => { setRoleFilter(val); setCurrentPage(1); }}>
                <SelectTrigger className="w-[140px] bg-[#0b0e14] border-white/5 text-white h-10 rounded-lg">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent className="bg-[#11141c] border-white/10 text-white">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="dept_approver">Dept Approver</SelectItem>
                </SelectContent>
              </Select>

              <Select value={deptFilter} onValueChange={(val) => { setDeptFilter(val); setCurrentPage(1); }}>
                <SelectTrigger className="w-[160px] bg-[#0b0e14] border-white/5 text-white h-10 rounded-lg">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent className="bg-[#11141c] border-white/10 text-white">
                  <SelectItem value="all">All Departments</SelectItem>
                  {uniqueDepartments.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                <SelectTrigger className="w-[140px] bg-[#0b0e14] border-white/5 text-white h-10 rounded-lg">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-[#11141c] border-white/10 text-white">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 shrink-0">
              <Button variant="outline" className="bg-[#0b0e14] border-white/5 text-[#8a94a6] hover:text-white hover:bg-white/5 h-10 rounded-lg">
                <Filter className="w-3.5 h-3.5 mr-2" />
                More Filters
              </Button>
              <Button variant="outline" size="icon" className="bg-[#0b0e14] border-white/5 text-[#8a94a6] hover:text-white hover:bg-white/5 h-10 w-10 rounded-lg">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-white/5 text-[#8a94a6] text-xs uppercase tracking-wider font-semibold">
                  <th className="px-6 py-4 font-semibold w-[30%]">User</th>
                  <th className="px-6 py-4 font-semibold">Role <span className="opacity-50 text-[10px]">↑↓</span></th>
                  <th className="px-6 py-4 font-semibold">Department <span className="opacity-50 text-[10px]">↑↓</span></th>
                  <th className="px-6 py-4 font-semibold">Employee ID <span className="opacity-50 text-[10px]">↑↓</span></th>
                  <th className="px-6 py-4 font-semibold">Status <span className="opacity-50 text-[10px]">↑↓</span></th>
                  <th className="px-6 py-4 font-semibold">Last Login <span className="opacity-50 text-[10px]">↑↓</span></th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedUsers.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-[#8a94a6]">No users found.</td></tr>
                ) : (
                  pagedUsers.map((u: any) => {
                    // Generate avatar initials
                    const initials = u.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
                    
                    // Map role to nice badge format
                    let roleText = "EMPLOYEE";
                    if (u.role === "admin") roleText = "SYSTEM ADMIN";
                    else if (u.role === "hr") roleText = "HR TEAM";
                    else if (u.role === "dept_approver") roleText = "DEPT_APPROVER";
                    else if (u.role === "manager") roleText = "MANAGER";

                    // Colors for avatars
                    const colors = [
                      "bg-blue-500", "bg-purple-500", "bg-orange-500", "bg-pink-500", "bg-emerald-500"
                    ];
                    const avatarColor = colors[u.name.length % colors.length];

                    return (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold shadow-inner`}>
                              {initials}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{u.name}</p>
                              <p className="text-xs text-[#8a94a6]">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider">
                            {roleText}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-[#cbd5e1]">{u.dept || "—"}</td>
                        <td className="px-6 py-3 text-sm text-[#cbd5e1]">{u.employee_id || `EMP-${Math.floor(Math.random() * 9000) + 1000}`}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                            <span className="text-sm text-[#10b981] font-medium">Active</span>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <p className="text-sm text-[#cbd5e1]">{formatDistanceToNow(new Date(u.updated_at), { addSuffix: true })}</p>
                          <p className="text-xs text-[#8a94a6]">09 Jun 2026, 09:15 AM</p>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8a94a6] hover:text-white hover:bg-white/5">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-[#11141c] border border-white/10 text-white">
                              <DropdownMenuItem className="focus:bg-[#171b26] focus:text-white cursor-pointer" onClick={() => handleRoleChange(u.id, "admin")}>Make Admin</DropdownMenuItem>
                              <DropdownMenuItem className="focus:bg-[#171b26] focus:text-white cursor-pointer" onClick={() => handleRoleChange(u.id, "hr")}>Make HR</DropdownMenuItem>
                              <DropdownMenuItem className="focus:bg-[#171b26] focus:text-white cursor-pointer" onClick={() => handleRoleChange(u.id, "employee")}>Make Employee</DropdownMenuItem>
                              <div className="h-px bg-white/10 my-1" />
                              <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer" onClick={() => handleDeactivate(u.id)}>Deactivate User</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-white/5 flex items-center justify-between text-sm text-[#8a94a6]">
            <div>
              Showing {totalUsers === 0 ? 0 : (activePage - 1) * pageSize + 1} to {Math.min(activePage * pageSize, totalUsers)} of {totalUsers} users
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Select value={String(pageSize)} onValueChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[110px] bg-[#0b0e14] border-white/5 text-white h-8 text-xs rounded-lg">
                    <SelectValue placeholder={`${pageSize} per page`} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#11141c] border-white/10 text-white">
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="20">20 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-[#0b0e14] border-white/5 text-[#8a94a6] hover:text-white rounded-md disabled:opacity-50"
                  onClick={() => setCurrentPage(1)}
                  disabled={activePage === 1}
                >
                  «
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-[#0b0e14] border-white/5 text-[#8a94a6] hover:text-white rounded-md disabled:opacity-50"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={activePage === 1}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>

                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNum = index + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant="outline"
                      className={`h-8 w-8 rounded-md p-0 flex items-center justify-center border-0 ${
                        activePage === pageNum
                          ? "bg-indigo-500 text-white hover:bg-indigo-600 font-bold"
                          : "bg-[#0b0e14] text-[#8a94a6] hover:text-white hover:bg-white/5"
                      }`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-[#0b0e14] border-white/5 text-[#8a94a6] hover:text-white rounded-md disabled:opacity-50"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={activePage === totalPages}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-[#0b0e14] border-white/5 text-[#8a94a6] hover:text-white rounded-md disabled:opacity-50"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={activePage === totalPages}
                >
                  »
                </Button>
              </div>
            </div>
          </div>
          
        </div>
      ) : (
        <div className="flex justify-center p-6 bg-[#11141c] border border-white/5 rounded-2xl overflow-hidden">
          <OrganizationProfile
            appearance={{
              variables: {
                colorPrimary: "#6366f1",
                colorBackground: "#11141c",
                colorInputBackground: "#0b0e14",
                colorText: "#ffffff",
                colorTextSecondary: "#8a94a6",
                colorInputText: "#ffffff",
                colorBorder: "rgba(255, 255, 255, 0.08)",
              },
              elements: {
                rootBox: "w-full max-w-5xl",
                card: "bg-transparent border-0 shadow-none w-full",
                navbar: "border-r border-white/5 pr-4",
                navbarButton: "text-[#8a94a6] hover:text-white hover:bg-white/5",
                navbarButtonActive: "text-indigo-400 bg-indigo-500/15 font-semibold",
                headerTitle: "text-white",
                headerSubtitle: "text-[#8a94a6]",
                profileSectionTitleText: "text-white",
                profileSectionTitle: "text-white border-b border-white/5",
                membershipRoleIcon: "text-[#8a94a6]",
                breadcrumbs: "hidden",
                scrollBox: "bg-transparent",
                pageScrollBox: "bg-transparent px-6",
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

