$AppDir = "artifacts\web\src\app"
$Pages = @(
  @{ Route = "page.tsx"; Component = "LandingPage" },
  @{ Route = "login\page.tsx"; Component = "LoginPage" },
  @{ Route = "(main)\dashboard\page.tsx"; Component = "DashboardPage" },
  @{ Route = "(main)\cases\page.tsx"; Component = "CasesPage" },
  @{ Route = "(main)\cases\new\page.tsx"; Component = "NewCasePage" },
  @{ Route = "(main)\cases\[id]\page.tsx"; Component = "CaseDetailPage" },
  @{ Route = "(main)\tasks\page.tsx"; Component = "TasksPage" },
  @{ Route = "(main)\tasks\[taskId]\page.tsx"; Component = "TaskDetailPage" },
  @{ Route = "(main)\resign\page.tsx"; Component = "ResignPage" },
  @{ Route = "(main)\reports\page.tsx"; Component = "ReportsPage" },
  @{ Route = "(main)\reports\audit\page.tsx"; Component = "AuditPage" },
  @{ Route = "(main)\settings\page.tsx"; Component = "SettingsPage" },
  @{ Route = "(main)\settings\departments\page.tsx"; Component = "SettingsDepartmentsPage" },
  @{ Route = "(main)\settings\workflows\page.tsx"; Component = "SettingsWorkflowsPage" },
  @{ Route = "(main)\settings\users\page.tsx"; Component = "SettingsUsersPage" },
  @{ Route = "(main)\settings\checklists\page.tsx"; Component = "SettingsChecklistsPage" },
  @{ Route = "(main)\preferences\page.tsx"; Component = "PreferencesPage" }
)

foreach ($page in $Pages) {
  $path = Join-Path $AppDir $page.Route
  $dir = Split-Path $path
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $content = "'use client';`nimport " + $page.Component + " from '@/components/pages/" + $page.Component + "';`nexport default function Page() { return <" + $page.Component + " />; }"
  Set-Content -Path $path -Value $content
}

# Add layout for (main)
$mainLayoutPath = Join-Path $AppDir "(main)\layout.tsx"
$mainLayoutContent = "'use client';`nimport { AppShell } from '@/components/layout/AppShell';`nexport default function MainLayout({ children }: { children: React.ReactNode }) { return <AppShell>{children}</AppShell>; }"
Set-Content -Path $mainLayoutPath -Value $mainLayoutContent
