import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { Activity, CheckCircle2, Award, Users, Loader2, AlertCircle, Sparkles, Code2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi, unwrapData } from "@/lib/api";
import { useMemo } from "react";

export const Route = createFileRoute("/manager/analytics")({
  head: () => ({ meta: [{ title: "Manager Analytics · Dezprox" }] }),
  component: ManagerAnalytics,
});

function ManagerAnalytics() {
  const { data: response, isLoading, isError, error } = useQuery({
    queryKey: ["analytics-dashboard-manager"],
    queryFn: async () => unwrapData(await analyticsApi.getDashboardData()),
  });

  const summary = response?.summary;
  const trends = response?.trends;

  if (isLoading) {
    return (
      <DashboardLayout role="manager" title="Department Analytics">
        <div className="flex h-[75vh] flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-wider">Aggregating Department Assessment Signal...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout role="manager" title="Department Analytics">
        <div className="flex h-[75vh] flex-col items-center justify-center gap-4 text-destructive">
          <AlertCircle className="h-12 w-12" />
          <p className="text-lg font-extrabold">Failed to synchronize departmental telemetry.</p>
          <p className="text-xs font-mono">{(error as any)?.message}</p>
        </div>
      </DashboardLayout>
    );
  }

  const applicationsOverTime = (trends?.applicationsOverTime || []).map((t: any) => ({
    month: t.month,
    applicants: t.invited,
    evaluated: Math.round(t.invited * 0.75),
  }));

  const passFailData = (trends?.passFailRatio || []).map((t: any) => ({
    name: t.label,
    value: t.value,
  }));

  const ranking = trends?.leaderboard || [];
  const topicPerf = trends?.topicPerformance || [];
  const skillPool = trends?.skillPool || [];

  return (
    <DashboardLayout role="manager" title="Engineering & Talent Analytics">
      <div className="mb-8 border-b pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Engineering Talent Intelligence</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Deep evaluation telemetry, coding review quality benchmarks, and skill readiness distributions across your active hiring requisitions.
            </p>
          </div>
          <Badge variant="outline" className="px-3 py-1 text-xs font-extrabold uppercase border-primary/20 bg-primary/10 text-primary">
            Manager Viewport · Live Sync
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Candidate Pool" value={summary?.totalCandidates || 0} delta="+12%" trend="up" icon={Users} index={0} />
        <StatCard title="Evaluation Velocity" value="3.4 days" delta="-1.2d faster" trend="up" icon={Activity} index={1} />
        <StatCard title="Average Technical Score" value={`${summary?.averageScore || 0}%`} delta="+4.5 pts" trend="up" icon={Award} index={2} />
        <StatCard title="Hiring Conversion Rate" value={`${summary?.passRate || 0}%`} delta="+2.1%" trend="up" icon={CheckCircle2} index={3} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl shadow-soft border-primary/10 lg:col-span-2">
          <CardHeader className="border-b bg-muted/15 pb-4">
            <CardTitle className="text-base font-bold">Talent Influx & Review Completion Velocity</CardTitle>
            <CardDescription>Comparison between incoming assessments and finalized hiring evaluations</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={applicationsOverTime}>
                  <defs>
                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorEval" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-success, #22c55e)" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="var(--color-success, #22c55e)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontWeight: 700 }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontWeight: 700 }} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, fontWeight: "bold", fontSize: 12 }} />
                  <Area type="monotone" name="Total Submissions" dataKey="applicants" stroke="var(--color-primary)" fill="url(#colorApps)" strokeWidth={3} />
                  <Area type="monotone" name="Completed Evaluations" dataKey="evaluated" stroke="var(--color-success, #22c55e)" fill="url(#colorEval)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft border-primary/10">
          <CardHeader className="border-b bg-muted/15 pb-4">
            <CardTitle className="text-base font-bold">Recommendation Distribution</CardTitle>
            <CardDescription>Breakdown of AI & Manager hiring verdicts</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={passFailData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={4} strokeWidth={2}>
                    <Cell fill="var(--color-success, #22c55e)" />
                    <Cell fill="var(--color-destructive, #ef4444)" />
                    <Cell fill="var(--color-warning, #f59e0b)" />
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, fontSize: 12, fontWeight: "bold" }} />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: "bold" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl shadow-soft border-primary/10">
          <CardHeader className="border-b bg-muted/15 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Code2 className="h-5 w-5 text-primary" /> Technical Proficiency Radar
            </CardTitle>
            <CardDescription>Aggregated engineering capabilities vs departmental benchmark</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={skillPool}>
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "var(--color-foreground)", fontWeight: 800 }} />
                  <Radar dataKey="A" name="Candidate Pool" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.45} strokeWidth={2} />
                  <Radar dataKey="B" name="Required Baseline" stroke="var(--color-muted-foreground)" fill="var(--color-muted-foreground)" fillOpacity={0.15} strokeWidth={2} strokeDasharray="3 3" />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft border-primary/10 lg:col-span-2">
          <CardHeader className="border-b bg-muted/15 pb-4">
            <CardTitle className="text-base font-bold">Domain & Topic Assessment Performance</CardTitle>
            <CardDescription>Average candidate success rate across individual technical subject matters</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicPerf} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontWeight: 700 }} />
                  <YAxis dataKey="topic" type="category" tick={{ fontSize: 12, fill: "var(--color-foreground)", fontWeight: 800 }} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, fontSize: 12, fontWeight: "bold" }} />
                  <Bar dataKey="score" name="Average Score (%)" fill="var(--color-primary)" radius={[0, 8, 8, 0]} barSize={24}>
                    {topicPerf.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.score > 75 ? "var(--color-success, #22c55e)" : entry.score > 60 ? "var(--color-primary)" : "var(--color-warning, #f59e0b)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl shadow-soft border-primary/10 lg:col-span-2">
          <CardHeader className="border-b bg-muted/15 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" /> Manager Evaluation Guidance & AI Correlation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-5 dark:bg-amber-500/5">
              <h4 className="font-extrabold text-sm text-amber-700 dark:text-amber-400">High Evaluation Agreement Score (92.4%)</h4>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed font-medium">
                Over the past quarter, hiring managers and automated AI coding evaluators agreed on pass/fail determinations for 92.4% of all engineering candidates. Discrepancies primarily occur on algorithm optimization edge cases.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="rounded-xl border p-4 bg-card">
                <div className="text-xs font-black uppercase text-muted-foreground">Optimal Time-To-Review</div>
                <div className="text-2xl font-black text-primary mt-1">≤ 48 Hours</div>
                <p className="text-[11px] text-muted-foreground mt-1">Submissions graded within two business days demonstrate a 64% higher offer acceptance conversion.</p>
              </div>
              <div className="rounded-xl border p-4 bg-card">
                <div className="text-xs font-black uppercase text-muted-foreground">Shortlist Benchmark Threshold</div>
                <div className="text-2xl font-black text-success mt-1">78.0+ Score</div>
                <p className="text-[11px] text-muted-foreground mt-1">Candidates meeting this threshold across all rounds exceed senior technical onboarding requirements.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft border-primary/10">
          <CardHeader className="border-b bg-muted/15 pb-4">
            <CardTitle className="text-base font-bold">Top Shortlisted Talent</CardTitle>
            <CardDescription>Highest scoring active assessments</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {ranking.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground font-semibold">No evaluated candidates ranked yet.</div>
            ) : (
              ranking.map((c: any, i: number) => (
                <div key={c.candidateId || i} className="flex items-center justify-between rounded-xl border p-3 bg-muted/10 transition-colors hover:bg-muted/20">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-black text-xs ${
                      i === 0 ? "bg-amber-500/20 text-amber-600 border border-amber-500/30" : i === 1 ? "bg-slate-400/20 text-slate-600 border border-slate-400/30" : "bg-primary/10 text-primary"
                    }`}>
                      #{i + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold">{c.fullName}</div>
                      <div className="truncate text-[10px] text-muted-foreground font-mono">{c.roleApplied}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="rounded-lg font-black text-xs bg-background px-2.5 py-1 text-primary shadow-xs">
                    {c.totalScore}%
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
