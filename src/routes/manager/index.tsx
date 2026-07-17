import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi, reportsApi, unwrapData } from "@/lib/api";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AnalyticsDashboardPayload, DashboardStats } from "@/types/api";
import {
  ArrowRight,
  Code2,
  Gauge,
  GitBranch,
  Loader2,
  Sparkles,
  Star,
  Users,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/manager/")({
  head: () => ({ meta: [{ title: "Manager · Dezprox" }] }),
  component: ManagerDashboard,
});

function ManagerDashboard() {
  const {
    data: dash,
    isLoading: dashLoading,
    isError: dashError,
    refetch: refetchDash,
  } = useQuery({
    queryKey: ["analytics", "dashboard-full", "manager"],
    queryFn: async () => unwrapData<AnalyticsDashboardPayload>(await analyticsApi.getDashboardData()),
    retry: 2,
    staleTime: 60_000,
  });

  const stats: DashboardStats | undefined = dash?.summary;
  const funnel = dash?.trends?.funnel ?? [];

  const { data: reviewQueue, isLoading: queueLoading } = useQuery({
    queryKey: ["reports", "review-queue"],
    queryFn: async () => {
      const page = unwrapData(await reportsApi.findAll({ limit: 5, page: 1 }));
      return page.data;
    },
    retry: 2,
  });

  const { data: shortlist, isLoading: shortlistLoading } = useQuery({
    queryKey: ["reports", "shortlist", "manager"],
    queryFn: async () => {
      const page = unwrapData(await reportsApi.findAll({ isShortlisted: true, limit: 5, page: 1 }));
      return page.data;
    },
    retry: 2,
  });

  const pendingAiCount = reviewQueue?.filter((r: { codingAiScore?: number | null }) => r.codingAiScore == null).length ?? 0;

  return (
    <DashboardLayout role="manager" title="Dashboard">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Engineering review queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">Technical evaluations and shortlist.</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => refetchDash()} disabled={dashLoading}>
          <RefreshCw className={`mr-1.5 h-4 w-4 ${dashLoading ? "animate-spin" : ""}`} />
          Refresh metrics
        </Button>
      </div>

      {dashError && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Some metrics could not be refreshed.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Candidates" value={stats?.totalCandidates ?? (dashLoading ? "—" : 0)} icon={Users} index={0} />
        <StatCard
          title="Active Assessments"
          value={stats?.activeAssessments ?? (dashLoading ? "—" : 0)}
          icon={Code2}
          index={1}
        />
        <StatCard
          title="Avg tech score"
          value={`${stats?.averageScore ?? 0}%`}
          icon={Star}
          index={2}
        />
        <StatCard title="Shortlisted" value={stats?.shortlisted ?? (dashLoading ? "—" : 0)} icon={GitBranch} index={3} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl shadow-soft lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Code review queue</CardTitle>
            <Link to="/manager/reviews" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {queueLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              reviewQueue?.map((r: any) => (
                <div key={r.id} className="rounded-2xl border bg-card/40 p-4 transition-all hover:shadow-soft">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/5 text-xs font-semibold text-primary">
                        {r.candidateFullName.split(" ").map((n: string) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{r.candidateFullName}</span>
                        <Badge variant="outline" className="rounded-full text-[10px] uppercase">
                          {r.roleApplied}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Submitted {r.codingLanguage ?? "—"} · {new Date(r.assessmentDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold tabular-nums">{Number(r.totalScore).toFixed(0)}%</div>
                      <div className="text-[10px] text-success">
                        {r.codingAiScore != null ? `AI: ${Number(r.codingAiScore).toFixed(0)}` : "Pending AI"}
                      </div>
                    </div>
                    <Link to="/manager/reviews" search={{ id: r.id }}>
                      <Button size="sm" variant="outline" className="rounded-xl">
                        Review <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
            {!queueLoading && reviewQueue?.length === 0 && (
              <div className="p-12 text-center text-sm italic text-muted-foreground">No reviews in your queue.</div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Hiring funnel
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-2 p-6">
                {dashLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  [
                    { label: "Passed", value: stats?.passed || 0, color: "var(--color-success)" },
                    { label: "Shortlisted", value: stats?.shortlisted || 0, color: "var(--color-primary)" },
                    { label: "Hired", value: stats?.hired || 0, color: "var(--color-info)" },
                    { label: "Rejected", value: stats?.rejected || 0, color: "var(--color-destructive)" },
                  ].map((s) => (
                    <div key={s.label} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span>{s.label}</span>
                        <span>{s.value}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, ((s.value || 0) / (stats?.totalCandidates || 1)) * 100)}%`,
                            background: s.color,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle>Platform activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-6 text-center">
                <Gauge className="mx-auto mb-2 h-12 w-12 text-primary opacity-20" />
                <div className="text-2xl font-black tabular-nums">{stats?.activeAssessments || 0}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Live assessments
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Candidate shortlist</CardTitle>
              <Link to="/manager/candidates" className="text-xs text-primary hover:underline">
                Candidates
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {shortlistLoading ? (
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
              ) : !shortlist?.length ? (
                <p className="py-4 text-center text-xs text-muted-foreground">No shortlisted reports</p>
              ) : (
                shortlist.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between rounded-xl border px-3 py-2">
                    <span className="truncate text-xs font-medium">{r.candidateFullName}</span>
                    <span className="text-xs font-bold tabular-nums">{Number(r.totalScore).toFixed(0)}%</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Coding evaluations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {pendingAiCount} submission{pendingAiCount === 1 ? "" : "s"} in the current sample awaiting AI coding scores.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
