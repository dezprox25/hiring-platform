import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Download, Filter, Sparkles, FileText, Mail, Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { candidatesApi, unwrapData } from "@/lib/api";

export const Route = createFileRoute("/manager/candidates")({
  head: () => ({ meta: [{ title: "Candidates · Dezprox" }] }),
  component: CandidatesPage,
});

const stageColor: Record<string, string> = {
  INVITED: "bg-muted text-muted-foreground",
  ACTIVE: "bg-info/15 text-info",
  SUBMITTED: "bg-warning/15 text-warning-foreground",
  EVALUATED: "bg-primary/15 text-primary",
  HIRED: "bg-success/15 text-success",
  REJECTED: "bg-destructive/15 text-destructive",
};

const recColor: Record<string, string> = {
  "Strong Hire": "bg-success/15 text-success border-success/30",
  Hire: "bg-primary/15 text-primary border-primary/30",
  Maybe: "bg-warning/15 text-warning-foreground border-warning/30",
  "No Hire": "bg-destructive/15 text-destructive border-destructive/30",
};

function CandidatesPage() {
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: response, isLoading, isError, error } = useQuery({
    queryKey: ["candidates-manager", { q, stage, page }],
    queryFn: () =>
      candidatesApi
        .findAll({
          search: q || undefined,
          status: stage === "all" ? undefined : stage,
          page,
          limit,
        })
        .then((res) => unwrapData(res)),
  });

  const candidates = response?.data || [];
  const total = response?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout role="manager" title="Candidates">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Team pipeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `${total} total candidates`}
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
                onChange={(e) => { setQ(e.target.value); setPage(1); }} 
                placeholder="Search by name or role…" 
                className="rounded-xl pl-9" 
              />
            </div>
            <Select value={stage} onValueChange={(val) => { setStage(val); setPage(1); }}>
              <SelectTrigger className="w-44 rounded-xl"><Filter className="mr-1.5 h-4 w-4" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                <SelectItem value="INVITED">Invited</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="EVALUATED">Evaluated</SelectItem>
                <SelectItem value="HIRED">Hired</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-destructive">
                <AlertCircle className="h-8 w-8" />
                <p>Failed to load candidates.</p>
              </div>
            ) : candidates.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
                <Search className="h-8 w-8 opacity-20" />
                <p>No candidates found.</p>
              </div>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                    <tr className="border-y bg-muted/40">
                      <th className="px-6 py-3 text-left font-medium">Candidate</th>
                      <th className="px-3 py-3 text-left font-medium">Role</th>
                      <th className="px-3 py-3 text-left font-medium">Stage</th>
                      <th className="px-3 py-3 text-left font-medium">Score</th>
                      <th className="px-3 py-3 text-left font-medium">AI</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {candidates.map((c: any) => (
                      <tr key={c.id} className="hover:bg-muted/30">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                {c.fullName.split(" ").map((n: any)=>n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{c.fullName}</div>
                              <div className="text-xs text-muted-foreground">{c.user?.email || "No email"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3"><div>{c.roleApplied}</div></td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${stageColor[c.status] || "bg-muted"}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-3 py-3"><span className="font-semibold tabular-nums">{c.report?.totalScore ?? "-"}%</span></td>
                        <td className="px-3 py-3">
                          {c.aiRecommendation ? (
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${recColor[c.aiRecommendation]}`}>
                              {c.aiRecommendation}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <Sheet>
                            <SheetTrigger asChild><Button size="sm" variant="ghost" className="rounded-lg">Review Detail</Button></SheetTrigger>
                            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                              <SheetHeader>
                                <SheetTitle>{c.fullName}</SheetTitle>
                                <SheetDescription>{c.roleApplied} · {c.experience || 0}y experience</SheetDescription>
                              </SheetHeader>
                              <div className="mt-6 grid gap-4">
                                <Card className="rounded-2xl"><CardContent className="p-5">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-14 w-14">
                                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                        {c.fullName.split(" ").map((n: any)=>n[0]).join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="text-lg font-semibold">{c.fullName}</div>
                                      <div className="text-xs text-muted-foreground">{c.user?.email}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-2xl font-semibold">{c.report?.totalScore ?? "-"}</div>
                                      <div className="text-[10px] uppercase text-muted-foreground">score</div>
                                    </div>
                                  </div>
                                </CardContent></Card>
                                {c.report && (
                                  <Card className="rounded-2xl shadow-soft">
                                    <CardHeader><CardTitle className="text-sm">Assessment Breakdown</CardTitle></CardHeader>
                                    <CardContent className="space-y-3">
                                       <div className="flex justify-between text-xs"><span>MCQ Score</span><span className="font-bold">{c.report.scores.mcq.percentage}%</span></div>
                                       <div className="flex justify-between text-xs"><span>Typing Accuracy</span><span className="font-bold">{c.report.scores.typing.accuracy}%</span></div>
                                       <div className="flex justify-between text-xs"><span>Coding Score</span><span className="font-bold">{c.report.scores.coding.score || c.report.scores.coding.aiScore || 0}%</span></div>
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
                            </SheetContent>
                          </Sheet>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
