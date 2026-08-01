import { createFileRoute, Link } from "@tanstack/react-router";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatCard } from "@/components/stat-card";
import {
  AnalyticsDashboardPayload,
  ChartPoint,
  DashboardStats,
  PieSlice,
  TrendPoint,
} from "@/types/api";
import {
  ArrowRight,
  ClipboardList,
  Gauge,
  Loader2,
  Sparkles,
  Users,
  AlertCircle,
  RefreshCw,
  Activity,
} from "lucide-react";
import { getAuthFirstName, getStoredAuthUser } from "@/lib/auth-user";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin · Dezprox" }] }),
  component: AdminDashboard,
});

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function AdminDashboard() {
  const user = getStoredAuthUser();
  const firstName = getAuthFirstName(user, "admin");
  const {
    dashLoading,
    dashError,
    refetchDash,
    failureReason,
    summary,
    topicChart,
    passFail,
    trends,
    leaderboard,
    funnel,
    recentCandidates,
    candidatesLoading,
    recentReports,
    reportsLoading,
  } = useDashboardData();

  return (
    <DashboardLayout role="admin" title="Dashboard">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Welcome back, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening across your hiring pipeline today.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => refetchDash()}
            disabled={dashLoading}
          >
            <RefreshCw className={`mr-1.5 h-4 w-4 ${dashLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link to="/admin/assessments">
            <Button variant="outline" className="rounded-xl">
              New assessment
            </Button>
          </Link>
          <Link to="/admin/candidates">
            <Button className="rounded-xl">
              View candidates <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {dashError && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Could not load analytics. {(failureReason as Error)?.message || "Please retry."}</span>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => refetchDash()}>
            Retry
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Candidates"
          value={summary?.totalCandidates?.toLocaleString() ?? (dashLoading ? "—" : "0")}
          icon={Users}
          index={0}
        />
        <StatCard
          title="Active Assessments"
          value={summary?.activeAssessments ?? (dashLoading ? "—" : 0)}
          icon={ClipboardList}
          index={1}
        />
        <StatCard
          title="Pass Rate"
          value={`${summary?.passRate ?? 0}%`}
          icon={Gauge}
          index={2}
        />
        <StatCard title="Hired" value={summary?.hired ?? (dashLoading ? "—" : 0)} icon={Sparkles} index={3} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl lg:col-span-2 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Topic performance</CardTitle>
              <p className="text-xs text-muted-foreground">Average score by category</p>
            </div>
            <Badge variant="secondary" className="rounded-full">
              Live
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {dashLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : topicChart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Activity className="h-8 w-8 opacity-30" />
                  No topic data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicChart}>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                    <YAxis tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                      }}
                    />
                    <Bar dataKey="value" fill="var(--color-primary)" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle>Pass / Fail ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {dashLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !passFail?.length ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No distribution data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={passFail}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {passFail.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl shadow-soft lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Hiring trends</CardTitle>
            <Badge variant="secondary" className="rounded-full">
              12 Months
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {dashLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !trends?.length ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No trend data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                    <YAxis tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="invited" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} />
                    <Line
                      type="monotone"
                      dataKey="hired"
                      stroke="var(--color-primary)"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Top performers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No leaderboard entries yet</p>
            ) : (
              leaderboard.map((c) => (
                <div key={c.candidateId} className="flex items-center gap-3 rounded-xl border bg-card/40 p-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {c.fullName.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{c.fullName}</div>
                    <div className="truncate text-xs text-muted-foreground">{c.roleApplied}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums">{c.totalScore}%</div>
                    <div className="text-[10px] text-success">{c.isShortlisted ? "Shortlisted" : ""}</div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Hiring funnel</CardTitle>
            <Badge variant="outline" className="rounded-full text-[10px]">
              By candidate status
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {dashLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : funnel.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No funnel data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnel} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid stroke="var(--color-border)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                    <YAxis
                      type="category"
                      dataKey="stage"
                      width={100}
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                      }}
                    />
                    <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Assessment activity</CardTitle>
            <Badge variant="secondary" className="rounded-full">
              In progress
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Gauge className="mb-2 h-12 w-12 text-primary opacity-20" />
            <div className="text-3xl font-black tabular-nums">{summary?.activeAssessments ?? 0}</div>
            <p className="mt-1 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Active assessments
            </p>
            <p className="mt-4 max-w-xs text-center text-xs text-muted-foreground">
              Pulled from assessments currently in MCQ, typing, or coding rounds.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent reports</CardTitle>
            <Link to="/admin/reports" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {reportsLoading ? (
                <div className="p-6 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !recentReports?.length ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No reports generated yet</div>
              ) : (
                recentReports.map((r: { id: string; candidateFullName: string; roleApplied: string; totalScore: number; assessmentDate: string }) => (
                  <Link
                    key={r.id}
                    to="/admin/reports"
                    className="flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-muted/30"
                  >
                    <Avatar>
                      <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
                        {r.candidateFullName.split(" ").map((n: string) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{r.candidateFullName}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {r.roleApplied} · {new Date(r.assessmentDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-sm font-semibold tabular-nums">{Number(r.totalScore).toFixed(0)}%</div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent candidates</CardTitle>
            <Link to="/admin/candidates" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {candidatesLoading ? (
                <div className="p-6 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !recentCandidates?.length ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No candidates yet</div>
              ) : (
                recentCandidates.map((c: { id: string; fullName: string; roleApplied: string; status: string; report?: { totalScore?: number } }) => (
                  <div key={c.id} className="flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-muted/30">
                    <Avatar>
                      <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
                        {c.fullName.split(" ").map((n: string) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{c.fullName}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {c.roleApplied} · {c.status}
                      </div>
                    </div>
                    <Badge variant="outline" className="rounded-full">
                      {c.status}
                    </Badge>
                    <div className="w-12 text-right text-sm font-semibold tabular-nums">
                      {c.report?.totalScore != null ? `${Number(c.report.totalScore).toFixed(0)}%` : "—"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
