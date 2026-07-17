import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend,
} from "recharts";
import { 
  Sparkles, ThumbsUp, AlertTriangle, CheckCircle2, MessageSquare, Brain, 
  Search, Filter, ChevronLeft, Loader2, AlertCircle, FileText, ChevronRight
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsApi, unwrapData } from "@/lib/api";
import { ReportDetailResponse, AiEvaluation } from "@/types/api";

import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Reports · Dezprox" }] }),
  component: Reports,
});

function Reports() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: listResponse, isLoading: isListLoading, isError: isListError } = useQuery({
    queryKey: ["reports", { page, q }],
    queryFn: async () => unwrapData(await reportsApi.findAll({ page, limit })),
    enabled: !selectedId,
  });

  const { data: detail, isLoading: isDetailLoading, isError: isDetailError } = useQuery({
    queryKey: ["report", selectedId],
    queryFn: async () => unwrapData(await reportsApi.findById(selectedId!)),
    enabled: !!selectedId,
  });

  if (selectedId && detail) {
    return <ReportDetail detail={detail} onBack={() => setSelectedId(null)} isLoading={isDetailLoading} isError={isDetailError} />;
  }

  return (
    <DashboardLayout role="admin" title="Reports">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Candidate Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isListLoading ? "Loading reports..." : `${listResponse?.total || 0} evaluation reports generated`}
          </p>
        </div>
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                placeholder="Search reports…" 
                className="rounded-xl pl-9" 
              />
            </div>
            <Button variant="outline" className="rounded-xl"><Filter className="mr-1.5 h-4 w-4" /> Filter</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isListLoading ? (
              <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : isListError ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-destructive">
                <AlertCircle className="h-8 w-8" />
                <p>Failed to load reports</p>
              </div>
            ) : listResponse?.data.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
                <FileText className="h-8 w-8 opacity-20" />
                <p>No reports found</p>
              </div>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                    <tr className="border-y bg-muted/40">
                      <th className="px-6 py-3 text-left font-medium">Candidate</th>
                      <th className="px-3 py-3 text-left font-medium">Role</th>
                      <th className="px-3 py-3 text-left font-medium">Overall</th>
                      <th className="px-3 py-3 text-left font-medium">MCQ</th>
                      <th className="px-3 py-3 text-left font-medium">Typing</th>
                      <th className="px-3 py-3 text-left font-medium">Coding</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {listResponse?.data.map((r: any) => (
                      <tr key={r.id} className="hover:bg-muted/30">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                                {r.candidateFullName.split(" ").map((n:any)=>n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{r.candidateFullName}</div>
                              <div className="text-[10px] text-muted-foreground">{new Date(r.assessmentDate).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs">{r.roleApplied}</td>
                        <td className="px-3 py-3 font-semibold tabular-nums">{r.totalScore}%</td>
                        <td className="px-3 py-3 text-xs tabular-nums">{r.mcqPercentage}%</td>
                        <td className="px-3 py-3 text-xs tabular-nums">{r.typingWpm} WPM</td>
                        <td className="px-3 py-3 text-xs tabular-nums">{r.codingManagerScore ?? r.codingAiScore ?? "-"}</td>
                        <td className="px-6 py-3 text-right">
                          <Button size="sm" variant="ghost" onClick={() => setSelectedId(r.id)} className="rounded-lg">Review</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-between border-t px-6 py-4">
                  <div className="text-xs text-muted-foreground">Page {page} of {Math.ceil((listResponse?.total || 0) / limit)}</div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-lg h-8 w-8 p-0"><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" disabled={page >= Math.ceil((listResponse?.total || 0) / limit)} onClick={() => setPage(p => p + 1)} className="rounded-lg h-8 w-8 p-0"><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

function ReportDetail({ detail, onBack, isLoading, isError }: { detail: ReportDetailResponse, onBack: () => void, isLoading: boolean, isError: boolean }) {
  if (isLoading) {
    return (
      <DashboardLayout role="admin" title="Report">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (isError) return <DashboardLayout role="admin" title="Report"><div className="flex h-screen items-center justify-center text-destructive"><AlertCircle className="h-12 w-12" /></div></DashboardLayout>;

  const { candidate, scores, aiEvaluation, feedback } = detail;
  const overall = scores.total;

  return (
    <DashboardLayout role="admin" title="Evaluation Report">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="rounded-xl"><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">AI Evaluation Report</h1>
          <p className="text-sm text-muted-foreground">Detailed scorecard for {candidate.fullName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl">Export PDF</Button>
          <Button className="rounded-xl">Share report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {candidate.fullName.split(" ").map((n:any)=>n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-lg font-semibold">{candidate.fullName}</div>
                <div className="text-xs text-muted-foreground">{candidate.roleApplied} · {candidate.email}</div>
                <Badge className="mt-2 rounded-full bg-success/15 text-success border-success/30" variant="outline">
                  <Sparkles className="mr-1 h-3 w-3" /> EVALUATED
                </Badge>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex items-end justify-between">
                <span className="text-xs uppercase text-muted-foreground">Hiring confidence</span>
                <span className="text-2xl font-semibold">{overall}%</span>
              </div>
              <Progress value={overall} className="mt-2 h-2" />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-center text-sm">
              <div className="rounded-xl border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground">MCQ</div>
                <div className="text-lg font-semibold">{scores.mcq.percentage}%</div>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground">Typing</div>
                <div className="text-lg font-semibold">{scores.typing.wpm} WPM</div>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3 col-span-2">
                <div className="text-xs text-muted-foreground">Coding Score</div>
                <div className="text-lg font-semibold">{scores.coding.score || scores.coding.aiScore || "Pending"}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> Topic breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <RadarChart data={Object.entries(scores.mcq.breakdown || {}).map(([topic, data]: any) => ({
                  skill: topic,
                  A: data.percentage,
                  B: 70
                }))}>
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <Radar dataKey="A" name="Candidate" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.4} />
                  <Radar dataKey="B" name="Benchmark" stroke="var(--color-chart-2)" fill="var(--color-chart-2)" fillOpacity={0.2} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-soft">
          <CardHeader><CardTitle className="flex items-center gap-2"><ThumbsUp className="h-4 w-4 text-success" /> AI Insights</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {aiEvaluation ? (
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border p-3">
                    <div className="text-[10px] uppercase text-muted-foreground mb-1">Logic</div>
                    <div className="font-semibold text-success">{aiEvaluation.codingAnalysis.logic}/100</div>
                  </div>
                  <div className="rounded-xl border p-3">
                    <div className="text-[10px] uppercase text-muted-foreground mb-1">Readability</div>
                    <div className="font-semibold text-primary">{aiEvaluation.codingAnalysis.readability}/100</div>
                  </div>
                  <div className="rounded-xl border p-3">
                    <div className="text-[10px] uppercase text-muted-foreground mb-1">Structure</div>
                    <div className="font-semibold text-info">{aiEvaluation.codingAnalysis.structure}/100</div>
                  </div>
                  <div className="rounded-xl border p-3">
                    <div className="text-[10px] uppercase text-muted-foreground mb-1">Clarity</div>
                    <div className="font-semibold text-warning">{aiEvaluation.communicationAnalysis.clarity}/100</div>
                  </div>
                </div>

                {aiEvaluation.summary && (
                  <div className="mt-2 rounded-xl bg-muted/30 p-4 italic text-muted-foreground border-l-4 border-primary/30">
                    "{aiEvaluation.summary}"
                  </div>
                )}

                <div className="mt-2 space-y-4">
                  <div>
                    <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-success">Key Strengths</div>
                    <ul className="space-y-1.5">
                      {aiEvaluation.strengths.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-success shrink-0" /> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-destructive">Areas to probe</div>
                    <ul className="space-y-1.5">
                      {aiEvaluation.weaknesses.map((w: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-warning-foreground shrink-0" /> {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground italic">No AI evaluation data available for this report.</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Manager feedback</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {feedback?.length > 0 ? feedback.map((f: any) => (
              <div key={f.id} className="rounded-xl border bg-muted/10 p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold">{f.manager}</span>
                  <Badge variant="outline" className="text-[10px]">{f.rating}/5</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{f.content}</p>
              </div>
            )) : (
              <div className="flex h-32 flex-col items-center justify-center text-muted-foreground opacity-50">
                <MessageSquare className="h-8 w-8 mb-2" />
                <p className="text-xs">No feedback provided yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 rounded-2xl shadow-soft">
        <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> AI summary & Recommendation</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">Final Recommendation:</div>
            <Badge className="rounded-full bg-primary/10 text-primary border-primary/20">{aiEvaluation?.recommendation || "PENDING"}</Badge>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {aiEvaluation?.summary || `${candidate.fullName} achieved a total score of ${overall}%. Performance across sections indicates ${overall > 70 ? 'strong' : 'moderate'} competency for the ${candidate.roleApplied} position.`}
          </p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
