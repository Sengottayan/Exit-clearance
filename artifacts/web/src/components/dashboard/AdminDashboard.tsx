import React, { useState } from 'react';
import { useAdminDashboard } from "@/hooks/api/useAdminDashboard";
import { useAuth } from "@/hooks/useAuth";
import { Users, FileText, Settings, Activity, ShieldCheck, Database, ArrowRight, Clock, AlertTriangle, ChevronRight, MoreVertical, Eye, Search, Bell, Zap, CheckCircle2 } from "lucide-react";
import { Link } from "@/lib/wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function AdminDashboard() {
  const { data: dashboardData, isLoading } = useAdminDashboard();
  const { user } = useAuth();
  
  if (isLoading || !dashboardData) {
    return <div className="min-h-screen bg-[#0b0e14] text-white p-6 md:p-8 flex items-center justify-center">Loading dashboard data...</div>;
  }

  const { kpis, pieData, trendData, activities: recentActivities, recentCases = [] } = dashboardData;
  const activeCasesCount = kpis.activeCases;
  const totalCasesCount = kpis.totalCases;
  const slaCompliance = kpis.slaCompliance ?? 100;
  const avgCompletionTime = kpis.avgCompletionTime ?? 0;
  const overdueCases = kpis.overdueCases ?? 0;

  // Sparklines can still be mock or we can skip them for now
  const sparklineData1 = [{ v: 10 }, { v: 15 }, { v: 13 }, { v: 20 }, { v: 25 }, { v: 22 }, { v: 28 }];
  const sparklineData2 = [{ v: 5 }, { v: 8 }, { v: 12 }, { v: 10 }, { v: 15 }, { v: 16 }, { v: 18 }];
  const sparklineData3 = [{ v: 85 }, { v: 88 }, { v: 90 }, { v: 89 }, { v: 91 }, { v: 92 }, { v: 93 }];
  const sparklineData4 = [{ v: 18 }, { v: 17 }, { v: 16 }, { v: 16 }, { v: 15 }, { v: 14.5 }, { v: 14 }];
  const sparklineData5 = [{ v: 5 }, { v: 6 }, { v: 4 }, { v: 5 }, { v: 4 }, { v: 3 }, { v: 3 }];

  // Format pieData percentages
  const totalPie = pieData.reduce((sum: number, d: any) => sum + d.value, 0);
  const formattedPieData = pieData.map((d: any) => ({
    ...d,
    percent: totalPie > 0 ? ((d.value / totalPie) * 100).toFixed(1) + '%' : '0%'
  }));

  const StatCard = ({ title, value, change, isPositive, icon: Icon, sparklineData, color, chartColor }: { title: string; value: string | number; change: string; isPositive: boolean; icon: any; sparklineData: any[]; color: string; chartColor: string }) => (
    <div className="bg-[#11141c] border border-white/5 rounded-xl p-5 flex flex-col relative overflow-hidden group hover:border-white/10 transition-colors">
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>
          <div className="flex items-center gap-1">
            <span className={`text-xs font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
              {isPositive ? '▲' : '▼'} {change}
            </span>
            <span className="text-xs text-muted-foreground">vs last 30 days</span>
          </div>
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-[#171b26] border border-white/5`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-50 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparklineData}>
            <Line type="monotone" dataKey="v" stroke={chartColor} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6 md:p-8 font-sans selection:bg-indigo-500/30">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Welcome back, {user?.name || "Admin"} <span className="inline-block animate-wave">👋</span></h1>
          <p className="text-[#8a94a6] text-sm font-medium">Here's what's happening across your offboarding platform today.</p>
        </div>
        <Button className="bg-[#5e6ad2] hover:bg-[#4f5abf] text-white shadow-lg shadow-indigo-500/20 font-semibold h-10 px-5 rounded-lg border-0 transition-all hover:scale-105">
          <Settings className="w-4 h-4 mr-2" />
          System Settings
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-6">
        <StatCard 
          title="TOTAL CASES INITIATED" value={totalCasesCount} change="16.7%" isPositive={true} 
          icon={Users} color="text-blue-400" chartColor="#3b82f6" sparklineData={sparklineData1} 
        />
        <StatCard 
          title="ACTIVE CASES" value={activeCasesCount} change="12.5%" isPositive={true} 
          icon={Activity} color="text-indigo-400" chartColor="#6366f1" sparklineData={sparklineData2} 
        />
        <StatCard 
          title="PLATFORM SLA SCORE" value={`${slaCompliance}%`} change="5.3%" isPositive={true} 
          icon={ShieldCheck} color="text-emerald-400" chartColor="#10b981" sparklineData={sparklineData3} 
        />
        <StatCard 
          title="AVG COMPLETION TIME" value={`${avgCompletionTime} DAYS`} change="1.2 days" isPositive={false} 
          icon={Clock} color="text-amber-400" chartColor="#f59e0b" sparklineData={sparklineData4} 
        />
        <StatCard 
          title="OVERDUE CASES" value={overdueCases} change="25%" isPositive={false} 
          icon={AlertTriangle} color="text-red-400" chartColor="#ef4444" sparklineData={sparklineData5} 
        />
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Cases Overview */}
        <div className="bg-[#11141c] border border-white/5 rounded-xl p-5 flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-white">Cases Overview</h3>
            <p className="text-xs text-[#8a94a6]">Case status distribution</p>
          </div>
          <div className="flex-1 flex items-center justify-between">
            <div className="w-1/2 h-[180px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formattedPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {formattedPieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{totalCasesCount}</span>
                <span className="text-[10px] text-[#8a94a6] uppercase tracking-wider">Total Cases</span>
              </div>
            </div>
            <div className="w-1/2 space-y-3 pl-4">
              {formattedPieData.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[#cbd5e1] text-xs">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium text-xs">{item.value}</span>
                    <span className="text-[#8a94a6] text-xs w-10 text-right">{item.percent}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Link href="/reports" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
              View full analytics <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Cases Trend */}
        <div className="bg-[#11141c] border border-white/5 rounded-xl p-5 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-base font-semibold text-white">Cases Trend</h3>
              <p className="text-xs text-[#8a94a6]">Last 30 days</p>
            </div>
            <select className="bg-[#171b26] border border-white/10 text-xs text-white rounded-md px-2 py-1 outline-none">
              <option>Last 30 Days</option>
              <option>Last 3 Months</option>
            </select>
          </div>
          <div className="flex-1 h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInitiated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8a94a6' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8a94a6' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171b26', borderColor: '#ffffff10', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ fontSize: '12px', color: '#8a94a6', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="uv" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorInitiated)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"/><span className="text-[10px] text-[#8a94a6]">Initiated</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"/><span className="text-[10px] text-[#8a94a6]">Completed</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"/><span className="text-[10px] text-[#8a94a6]">In Clearance</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"/><span className="text-[10px] text-[#8a94a6]">Overdue</span></div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#11141c] border border-white/5 rounded-xl p-5 flex flex-col">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h3 className="text-base font-semibold text-white">Recent Activity</h3>
              <p className="text-xs text-[#8a94a6]">Latest platform activities</p>
            </div>
            <Link href="/reports/audit" className="text-xs text-indigo-400 hover:text-indigo-300">View All</Link>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {recentActivities.map((activity: any) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`mt-0.5`}>
                  <Activity className={`w-4 h-4 text-indigo-400`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{activity.action}</p>
                  <p className="text-xs text-[#8a94a6] truncate">{activity.user}</p>
                </div>
                <div className="text-[10px] text-[#8a94a6] whitespace-nowrap">{activity.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Recent Cases Table */}
        <div className="lg:col-span-3 bg-[#11141c] border border-white/5 rounded-xl p-5">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h3 className="text-base font-semibold text-white">Recent Cases</h3>
              <p className="text-xs text-[#8a94a6]">Latest case updates across the platform</p>
            </div>
            <Link href="/cases" className="text-xs text-indigo-400 hover:text-indigo-300">View All Cases →</Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="pb-3 text-[10px] font-semibold text-[#8a94a6] uppercase tracking-wider font-mono">CASE ID</th>
                  <th className="pb-3 text-[10px] font-semibold text-[#8a94a6] uppercase tracking-wider font-mono">EMPLOYEE</th>
                  <th className="pb-3 text-[10px] font-semibold text-[#8a94a6] uppercase tracking-wider font-mono">DEPARTMENT</th>
                  <th className="pb-3 text-[10px] font-semibold text-[#8a94a6] uppercase tracking-wider font-mono">LAST WORKING DAY</th>
                  <th className="pb-3 text-[10px] font-semibold text-[#8a94a6] uppercase tracking-wider font-mono">PROGRESS</th>
                  <th className="pb-3 text-[10px] font-semibold text-[#8a94a6] uppercase tracking-wider font-mono">SLA STATUS</th>
                  <th className="pb-3 text-[10px] font-semibold text-[#8a94a6] uppercase tracking-wider font-mono">STATUS</th>
                  <th className="pb-3 text-[10px] font-semibold text-[#8a94a6] uppercase tracking-wider font-mono text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentCases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-[#8a94a6]">
                      No recent cases found. Initiate a new exit case to get started.
                    </td>
                  </tr>
                ) : (
                  recentCases.map((c: any) => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3 text-xs text-[#cbd5e1] font-mono">{c.id}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className={`w-6 h-6 text-[10px] ${c.avatarColor} text-white border-0`}>
                            <AvatarFallback className="bg-transparent">{c.avatar}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-medium text-white">{c.name}</p>
                            <p className="text-[10px] text-[#8a94a6]">{c.dept}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-xs text-[#cbd5e1]">{c.dept}</td>
                      <td className="py-3 text-xs text-[#cbd5e1]">{c.lwd}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2 max-w-[120px]">
                          <Progress value={c.progress} className="h-1.5 bg-white/10 [&>div]:bg-indigo-500" />
                          <span className="text-[10px] text-[#8a94a6] font-mono w-8">{c.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border border-transparent ${c.slaColor}`}>
                          {c.sla}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`text-xs font-medium ${c.statusColor}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="w-6 h-6 text-[#8a94a6] hover:text-white hover:bg-white/10 rounded">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-6 h-6 text-[#8a94a6] hover:text-white hover:bg-white/10 rounded">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-[#8a94a6]">
              {recentCases.length === 0
                ? "Showing 0 cases"
                : `Showing 1 to ${recentCases.length} of ${totalCasesCount} cases`}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="w-6 h-6 bg-transparent border-white/10 text-[#8a94a6] hover:text-white hover:bg-white/5"><ChevronRight className="w-3 h-3 rotate-180" /></Button>
              <Button variant="outline" size="sm" className="w-6 h-6 p-0 bg-indigo-600 border-indigo-600 text-white text-xs hover:bg-indigo-700 hover:text-white">1</Button>
              <Button variant="outline" size="sm" className="w-6 h-6 p-0 bg-transparent border-transparent text-[#8a94a6] text-xs hover:text-white">2</Button>
              <Button variant="outline" size="sm" className="w-6 h-6 p-0 bg-transparent border-transparent text-[#8a94a6] text-xs hover:text-white">3</Button>
              <span className="text-[#8a94a6] text-xs px-1">...</span>
              <Button variant="outline" size="icon" className="w-6 h-6 bg-transparent border-white/10 text-[#8a94a6] hover:text-white hover:bg-white/5"><ChevronRight className="w-3 h-3" /></Button>
            </div>
          </div>
        </div>

        {/* Side Panels */}
        <div className="space-y-6">
          <div className="bg-[#11141c] border border-white/5 rounded-xl p-5">
            <h3 className="text-base font-semibold text-white mb-1">Admin Shortcuts</h3>
            <p className="text-xs text-[#8a94a6] mb-4">Quick access to important controls</p>
            <div className="space-y-1">
              <Link href="/settings/users">
                <div className="flex items-center justify-between p-2.5 -mx-2.5 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors">
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-[#8a94a6] group-hover:text-white transition-colors" />
                    <span className="text-sm text-[#cbd5e1] group-hover:text-white transition-colors">Manage Users & Roles</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#8a94a6]/50 group-hover:text-white transition-colors" />
                </div>
              </Link>
              <Link href="/settings/departments">
                <div className="flex items-center justify-between p-2.5 -mx-2.5 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors">
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-[#8a94a6] group-hover:text-white transition-colors" />
                    <span className="text-sm text-[#cbd5e1] group-hover:text-white transition-colors">Department Workflows</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#8a94a6]/50 group-hover:text-white transition-colors" />
                </div>
              </Link>
              <Link href="/reports/audit">
                <div className="flex items-center justify-between p-2.5 -mx-2.5 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-[#8a94a6] group-hover:text-white transition-colors" />
                    <span className="text-sm text-[#cbd5e1] group-hover:text-white transition-colors">System Audit Trail</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#8a94a6]/50 group-hover:text-white transition-colors" />
                </div>
              </Link>
              <Link href="/settings/sla">
                <div className="flex items-center justify-between p-2.5 -mx-2.5 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-[#8a94a6] group-hover:text-white transition-colors" />
                    <span className="text-sm text-[#cbd5e1] group-hover:text-white transition-colors">SLA Configuration</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#8a94a6]/50 group-hover:text-white transition-colors" />
                </div>
              </Link>
            </div>
          </div>

          <div className="bg-[#11141c] border border-white/5 rounded-xl p-5 flex items-center justify-between group hover:border-white/10 transition-colors cursor-default">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center relative">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping" style={{ animationDuration: '3s'}}></div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">System Status</h3>
                <p className="text-xs text-[#8a94a6]">All systems operational</p>
              </div>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0 rounded">Healthy</Badge>
          </div>
        </div>
      </div>
      
    </div>
  );
}
