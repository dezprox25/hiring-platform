import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { Activity, TrendingUp, Target, Users, Loader2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi, unwrapData } from "@/lib/api";
import { useMemo } from "react";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics · Dezprox" }] }),
  component: Analytics,
});

const COLORS = ["var(--color-chart-1)","var(--color-chart-2)","var(--color-chart-3)","var(--color-chart-4)","var(--color-chart-5)"];

function Heatmap() {
  // 7x12 grid with simulated intensity
  const cells = useMemo(() => Array.from({ length: 7 * 12 }, (_, i) => {
    const v = Math.abs(Math.sin(i * 1.3) * Math.cos(i * 0.7));
    return Math.round(v * 100);
  }), []);
  return (
    <div className="grid grid-cols-12 gap-1.5">
      {cells.map((v, i) => (
        <div key={i} className="aspect-square rounded-md" style={{ background: `color-mix(in oklab, var(--color-primary) ${v}%, transparent)` }} title={`${v}%`} />
      ))}
    </div>
  );
}

function Analytics() {
  const { data: response, isLoading, isError, error } = useQuery({
    queryKey: ["analytics-dashboard"],
    queryFn: async () => unwrapData(await analyticsApi.getDashboardData()),
  });

  const summary = response?.summary;
  const trends = response?.trends;

  if (isLoading) {
    return (
      <DashboardLayout role="admin" title="Analytics">
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout role="admin" title="Analytics">
        <div className="flex h-[80vh] flex-col items-center justify-center gap-4 text-destructive">
          <AlertCircle className="h-12 w-12" />
          <p className="text-lg font-medium">Failed to load analytics data.</p>
          <p className="text-sm">{(error as any)?.message}</p>
        </div>
      </DashboardLayout>
    );
  }

  const applicationsOverTime = (trends?.applicationsOverTime || []).map((t: any) => ({
    month: t.month,
    applicants: t.invited,
  }));

  const passFailData = (trends?.passFailRatio || []).map((t: any) => ({
    name: t.label,
    value: t.value,
  }));

  const ranking = trends?.leaderboard || [];

  return (
    <DashboardLayout role="admin" title="Analytics">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Deep insights across your hiring funnel and skill coverage.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Conversion" value={`${summary?.passRate || 0}%`} delta="+0.9%" icon={Activity} />
        <StatCard title="Time to hire" value="14d" delta="-2d" trend="up" icon={TrendingUp} />
        <StatCard title="Quality score" value={summary?.averageScore || 0} delta="+3.2" icon={Target} />
        <StatCard title="Active roles" value={summary?.activeAssessments || 0} delta="+5" icon={Users} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl shadow-soft lg:col-span-2">
          <CardHeader><CardTitle>Applicant volume</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={applicationsOverTime}>
                  <defs>
                    <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                  <Area dataKey="applicants" stroke="var(--color-primary)" fill="url(#ga)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader><CardTitle>Pass / fail</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={passFailData} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    <Cell fill="var(--color-success)" /><Cell fill="var(--color-destructive)" /><Cell fill="var(--color-warning)" />
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl shadow-soft lg:col-span-2">
          <CardHeader><CardTitle>Topic performance</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={trends?.topicPerformance || []}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="topic" tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                  <Bar dataKey="score" fill="var(--color-primary)" radius={[10,10,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-soft">
          <CardHeader><CardTitle>Skill pentagon</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <RadarChart data={trends?.skillPool || []}>
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <Radar dataKey="A" name="Pool" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.4} />
                  <Radar dataKey="B" name="Target" stroke="var(--color-chart-2)" fill="var(--color-chart-2)" fillOpacity={0.2} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle>Activity heatmap</CardTitle>
            <p className="text-xs text-muted-foreground">Assessment submissions, last 12 weeks</p>
          </CardHeader>
          <CardContent><Heatmap /></CardContent>
        </Card>
        <Card className="rounded-2xl shadow-soft">
          <CardHeader><CardTitle>Top candidates</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {ranking.map((c: any, i: number) => (
              <div key={c.candidateId} className="flex items-center gap-3 rounded-xl border bg-card/40 p-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i+1}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{c.fullName}</div>
                  <div className="truncate text-xs text-muted-foreground">{c.roleApplied}</div>
                </div>
                <Badge variant="outline" className="rounded-full">{c.totalScore}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 rounded-2xl shadow-soft">
        <CardHeader><CardTitle>Funnel</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(trends?.funnel || []).map((s: any, i: number, arr: any[]) => {
              const pct = (s.count / (arr[0]?.count || 1)) * 100;
              return (
                <div key={s.stage} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-muted-foreground">{s.stage}</div>
                  <div className="relative h-9 flex-1 overflow-hidden rounded-xl bg-muted">
                    <div className="h-full rounded-xl" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length], opacity: 0.85 }} />
                    <div className="absolute inset-0 flex items-center justify-end px-3 text-xs font-medium text-foreground">
                      {s.count.toLocaleString()} · {pct.toFixed(0)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
