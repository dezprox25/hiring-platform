import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, FileText, BarChart3, Settings, ClipboardList, Brain,
  KanbanSquare, Code2, CalendarClock, UserCircle2, Building2, LogOut, Bell, Search, Sun, Moon
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  SidebarHeader, SidebarFooter, SidebarInset, useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export type Role = "admin" | "manager" | "hr" | "candidate";

const navByRole: Record<Role, { title: string; url: string; icon: any }[]> = {
  admin: [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Candidates", url: "/admin/candidates", icon: Users },
    { title: "Assessments", url: "/admin/assessments", icon: ClipboardList },
    { title: "Questions", url: "/admin/questions", icon: FileText },
    { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
    { title: "AI Reports", url: "/admin/reports", icon: Brain },
    { title: "Users", url: "/admin/users", icon: UserCircle2 },
    { title: "Settings", url: "/admin/settings", icon: Settings },
  ],
  manager: [
    { title: "Dashboard", url: "/manager", icon: LayoutDashboard },
    { title: "Candidates", url: "/manager/candidates", icon: Users },
    { title: "Code Reviews", url: "/manager/reviews", icon: Code2 },
    { title: "Analytics", url: "/manager/analytics", icon: BarChart3 },
    { title: "Settings", url: "/manager/settings", icon: Settings },
  ],
  hr: [
    { title: "Dashboard", url: "/hr", icon: LayoutDashboard },
    { title: "Pipeline", url: "/hr/pipeline", icon: KanbanSquare },
    { title: "Interviews", url: "/hr/interviews", icon: CalendarClock },
    { title: "Candidates", url: "/hr/candidates", icon: Users },
    { title: "Settings", url: "/hr/settings", icon: Settings },
  ],
  candidate: [
    { title: "Dashboard", url: "/candidate", icon: LayoutDashboard },
    { title: "Assessment", url: "/candidate/assessment", icon: ClipboardList },
    { title: "Results", url: "/candidate/results", icon: BarChart3 },
    { title: "Profile", url: "/candidate/profile", icon: UserCircle2 },
  ],
};

const roleMeta: Record<Role, { name: string; email: string; label: string }> = {
  admin: { name: "Priya Malhotra", email: "priya@dezprox.com", label: "Admin" },
  manager: { name: "Karan Mehta", email: "karan@dezprox.com", label: "Engineering Manager" },
  hr: { name: "Neha Gupta", email: "neha@dezprox.com", label: "HR Lead" },
  candidate: { name: "Aarav Sharma", email: "aarav@dezprox.com", label: "Candidate" },
};
import { authApi } from "@/lib/api";
import { getAuthDisplayName, getStoredAuthUser, type StoredAuthUser } from "@/lib/auth-user";
import { NotificationCenter } from "@/components/notification-center";

function AppSidebar({ role, onLogout }: { role: Role; onLogout: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const items = navByRole[role];
  
  const user = getStoredAuthUser();
  const meta = user
    ? {
        name: getAuthDisplayName(user, role),
        email: user.email || roleMeta[role].email,
        label: (user.role ?? role).toUpperCase(),
      }
    : roleMeta[role];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2.5 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-elegant">
            <Building2 className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">Dezprox</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Hiring Platform</span>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = path === item.url || (item.url !== `/${role}` && path.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-col gap-2 p-2">
          {!collapsed && (
            <div className="flex items-center gap-3 rounded-xl border bg-card/50 p-3 shadow-soft">
              <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                  {meta.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-bold tracking-tight">{meta.name}</span>
                <span className="truncate text-[10px] text-muted-foreground">{meta.email}</span>
              </div>
            </div>
          )}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={onLogout} className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
  }, []);
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        const next = !dark;
        document.documentElement.classList.toggle("dark", next);
        setDark(next);
      }}
      className="rounded-xl"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

export function DashboardLayout({ children, role, title }: { children: ReactNode; role: Role; title: string }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<StoredAuthUser | null>(null);

  useEffect(() => {
    const parsedUser = getStoredAuthUser();
    if (parsedUser) {
      setUser(parsedUser);

      if (parsedUser.role && parsedUser.role !== role) {
        toast.error("Unauthorized access", { description: "You don't have permission to access this area." });
        navigate({ to: `/${parsedUser.role}` });
      }
    }
  }, [role, navigate]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      localStorage.clear();
      toast.success("Logged out successfully");
      navigate({ to: "/login" });
    }
  };

  const meta = user
    ? {
        name: getAuthDisplayName(user, role),
        email: user.email || roleMeta[role].email,
        label: (user.role ?? role).toUpperCase(),
      }
    : roleMeta[role];

  return (
    <SidebarProvider>
      <AppSidebar role={role} onLogout={handleLogout} />
      <SidebarInset className="bg-muted/30">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur transition-[width,height] ease-linear">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center gap-2 px-4">
            <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." className="h-8 w-64 rounded-xl pl-8 text-xs bg-muted/50 border-none focus-visible:ring-1" />
            </div>
            <NotificationCenter />
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={handleLogout}><LogOut className="h-4 w-4 text-destructive" /></Button>
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
