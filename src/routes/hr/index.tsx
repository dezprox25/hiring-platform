import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { candidatesApi, reportsApi, unwrapData } from "@/lib/api";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyticsDashboardPayload, DashboardStats } from "@/types/api";
import { ArrowRight, CalendarClock, CheckCircle2, Loader2, Users, AlertCircle, RefreshCw } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export const Route = createFileRoute("/hr/")({
  head: () => ({ meta: [{ title: "HR · Dezprox" }] }),
  component: HRDashboard,
});

function HRDashboard() {
  const { dashLoading, dashError, refetchDash, summary: stats, funnel } = useDashboardData();

  const { data: pipeline, isLoading: pipelineLoading } = useQuery({
    queryKey: ["candidates", "pipeline-hr"],
    queryFn: async () => {
      const page = unwrapData(await candidatesApi.findAll({ limit: 12, page: 1 }));
      return page.data;
    },
    retry: 2,
  });

  const { data: recentReports, isLoading: reportsLoading } = useQuery({
    queryKey: ["reports", "recent-hr"],
    queryFn: async () => {
      const page = unwrapData(await reportsApi.findAll({ limit: 12, page: 1 }));
      return page.data;
    },
    retry: 2,
  });

  const pendingEvaluations =
    recentReports?.filter((r: { codingAiScore?: number | null }) => r.codingAiScore == null) ?? [];
  const withScores = recentReports?.filter((r: { totalScore?: number }) => r.totalScore != null) ?? [];

  return (
    <DashboardLayout role="hr" title="Dashboard">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Recruitment overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pipeline health, submissions, and evaluation backlog.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => refetchDash()} disabled={dashLoading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${dashLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link to="/hr/pipeline">
            <Button className="rounded-xl">
              Open pipeline <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {dashError && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Analytics could not be loaded. Charts may be incomplete until you refresh.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="In pipeline" value={stats?.totalCandidates ?? (dashLoading ? "—" : 0)} icon={Users} index={0} />
        <StatCard
          title="Active Assessments"
          value={stats?.activeAssessments ?? (dashLoading ? "—" : 0)}
          icon={CalendarClock}
          index={1}
        />
        <StatCard title="Passed" value={stats?.passed ?? (dashLoading ? "—" : 0)} icon={CheckCircle2} index={2} />
        <StatCard title="Shortlisted" value={stats?.shortlisted ?? (dashLoading ? "—" : 0)} icon={CheckCircle2} index={3} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle>Candidate pipeline</CardTitle>
            <p className="text-xs text-muted-foreground">Latest candidates by stage</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] divide-y overflow-y-auto">
              {pipelineLoading ? (
                <div className="space-y-2 p-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : !pipeline?.length ? (
                <div className="p-12 text-center text-sm text-muted-foreground">No candidates yet</div>
              ) : (
                pipeline.map((c: { id: string; fullName: string; roleApplied: string; status: string }) => (
                  <div key={c.id} className="flex items-center gap-3 px-6 py-4 transition-colors hover:bg-muted/30">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/5 text-xs font-semibold text-primary">
                        {c.fullName.split(" ").map((n: string) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{c.fullName}</div>
                      <div className="truncate text-xs text-muted-foreground">{c.roleApplied}</div>
                    </div>
                    <Badge variant="outline" className="rounded-full text-[10px] uppercase tracking-wider">
                      {c.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle>Hiring funnel</CardTitle>
            <p className="text-xs text-muted-foreground">Counts by candidate status</p>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              {dashLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : funnel.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No funnel data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnel}>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="stage" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                      }}
                    />
                    <Bar dataKey="count" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle>Recent submissions</CardTitle>
            <p className="text-xs text-muted-foreground">Latest generated reports</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[360px] divide-y overflow-y-auto">
              {reportsLoading ? (
                <div className="p-12 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !recentReports?.length ? (
                <div className="p-12 text-center text-sm text-muted-foreground">No reports yet</div>
              ) : (
                recentReports.map(
                  (r: {
                    id: string;
                    candidateFullName: string;
                    roleApplied: string;
                    totalScore: number;
                    codingAiScore?: number | null;
                  }) => (
                    <div key={r.id} className="flex items-center gap-3 px-6 py-4 transition-colors hover:bg-muted/30">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{r.candidateFullName}</div>
                        <div className="truncate text-xs text-muted-foreground">{r.roleApplied}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-primary tabular-nums">{Number(r.totalScore).toFixed(0)}%</div>
                        <div className="text-[10px] text-muted-foreground uppercase">
                          {r.codingAiScore != null ? `AI ${Number(r.codingAiScore).toFixed(0)}` : "AI pending"}
                        </div>
                      </div>
                    </div>
                  ),
                )
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle>Pending evaluations</CardTitle>
            <p className="text-xs text-muted-foreground">Reports awaiting AI coding score</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[360px] divide-y overflow-y-auto">
              {reportsLoading ? (
                <div className="p-12 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                </div>
              ) : pendingEvaluations.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground">No pending AI evaluations</div>
              ) : (
                pendingEvaluations.map(
                  (r: { id: string; candidateFullName: string; roleApplied: string; totalScore: number }) => (
                    <div key={r.id} className="flex items-center gap-3 px-6 py-4 transition-colors hover:bg-muted/30">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{r.candidateFullName}</div>
                        <div className="truncate text-xs text-muted-foreground">{r.roleApplied}</div>
                      </div>
                      <Badge variant="secondary" className="rounded-full text-[10px]">
                        Awaiting AI
                      </Badge>
                      <div className="text-sm font-semibold tabular-nums">{Number(r.totalScore).toFixed(0)}%</div>
                    </div>
                  ),
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 rounded-2xl shadow-soft">
        <CardHeader>
          <CardTitle>Assessment completion rates</CardTitle>
          <p className="text-xs text-muted-foreground">Share of recent reports with AI coding scores</p>
        </CardHeader>
        <CardContent>
          {reportsLoading || !recentReports?.length ? (
            <p className="text-sm text-muted-foreground">
              {reportsLoading ? "Loading report metrics…" : "No completed assessments to measure yet."}
            </p>
          ) : (
            <div className="flex flex-wrap items-end gap-8">
              <div>
                <div className="text-3xl font-black tabular-nums text-primary">
                  {Math.round((withScores.filter((r: { codingAiScore?: number | null }) => r.codingAiScore != null).length / withScores.length) * 100) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">AI evaluation coverage (recent sample)</p>
              </div>
              <div className="text-sm text-muted-foreground">
                Based on {withScores.length} recent report{withScores.length === 1 ? "" : "s"}.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
