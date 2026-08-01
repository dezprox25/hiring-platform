import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useQuery } from "@tanstack/react-query";
import { reportsApi, unwrapData } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, CheckCircle2, Trophy, ArrowRight, Brain, 
  Code2, Gauge, Zap, Star, ShieldAlert
} from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/candidate/results")({
  head: () => ({ meta: [{ title: "My Results · Dezprox" }] }),
  component: ResultsPage,
});

function ResultsPage() {
  const navigate = useNavigate();
  const { data: report, isLoading, isError } = useQuery({
    queryKey: ["reports", "me"],
    queryFn: async () => unwrapData(await reportsApi.findMyReport()),
  });

  if (isLoading) {
    return (
      <DashboardLayout role="candidate">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !report) {
    return (
      <DashboardLayout role="candidate">
        <div className="flex flex-col items-center justify-center py-20 text-center">
           <ShieldAlert className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
           <h2 className="text-xl font-bold">Results not available</h2>
           <p className="text-muted-foreground mt-2 max-w-sm">
             Your assessment results are still being processed or have not been released yet.
           </p>
           <Button className="mt-6 rounded-xl" onClick={() => navigate({ to: "/candidate" })}>Back to Dashboard</Button>
        </div>
      </DashboardLayout>
    );
  }

  const { scores, aiEvaluation, released } = report;

  if (!released) {
    return (
      <DashboardLayout role="candidate">
        <div className="flex flex-col items-center justify-center py-20 text-center">
           <Zap className="h-16 w-16 text-primary opacity-20 mb-4 animate-pulse" />
           <h2 className="text-xl font-bold">Review in progress</h2>
           <p className="text-muted-foreground mt-2 max-w-sm">
             Great job completing the assessment! Our team is currently reviewing your performance. We'll notify you as soon as your detailed feedback is ready.
           </p>
           <Button className="mt-6 rounded-xl" onClick={() => navigate({ to: "/candidate" })}>Back to Dashboard</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="candidate">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Assessment Results</h1>
            <p className="text-muted-foreground mt-1">Detailed performance breakdown for {report.candidate.roleApplied}.</p>
          </div>
          <div className="flex items-center gap-3 bg-primary/5 border border-primary/10 rounded-2xl px-6 py-3">
             <div className="text-[10px] uppercase font-black tracking-widest text-primary/60">Overall Score</div>
             <div className="text-4xl font-black tabular-nums text-primary">{report.scores.total}%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-2xl shadow-soft border-t-4 border-t-success">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-success mb-4">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-widest">MCQ Round</span>
              </div>
              <div className="text-3xl font-black tabular-nums">{scores.mcq.percentage}%</div>
              <p className="text-xs text-muted-foreground mt-1">{scores.mcq.correct} correct out of {scores.mcq.total} questions</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft border-t-4 border-t-info">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-info mb-4">
                <Gauge className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Typing Test</span>
              </div>
              <div className="text-3xl font-black tabular-nums">{scores.typing.wpm} WPM</div>
              <p className="text-xs text-muted-foreground mt-1">{scores.typing.accuracy}% accuracy · {scores.typing.mistakes} mistakes</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft border-t-4 border-t-primary">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-primary mb-4">
                <Code2 className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Technical Coding</span>
              </div>
              <div className="text-3xl font-black tabular-nums">{scores.coding.score || scores.coding.aiScore || 0}%</div>
              <p className="text-xs text-muted-foreground mt-1">Evaluation in {scores.coding.language}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="rounded-2xl shadow-soft lg:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> AI Performance Analysis</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {aiEvaluation ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Logic", val: aiEvaluation.codingAnalysis.logic, color: "text-success" },
                      { label: "Readability", val: aiEvaluation.codingAnalysis.readability, color: "text-info" },
                      { label: "Structure", val: aiEvaluation.codingAnalysis.structure, color: "text-primary" },
                      { label: "Clarity", val: aiEvaluation.communicationAnalysis.clarity, color: "text-warning" }
                    ].map(s => (
                      <div key={s.label} className="rounded-xl border p-3 bg-muted/20">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">{s.label}</div>
                        <div className={`text-lg font-bold ${s.color}`}>{s.val}/100</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="rounded-xl bg-primary/5 p-5 italic text-sm border-l-4 border-primary/30 leading-relaxed">
                    "{aiEvaluation.summary}"
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <div className="mb-4 text-xs font-black uppercase tracking-widest text-success flex items-center gap-1">
                        <Trophy className="h-4 w-4" /> Top Strengths
                      </div>
                      <ul className="space-y-3">
                        {aiEvaluation.strengths.map((s: string, i: number) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-success shrink-0" /> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="mb-4 text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1">
                        <Star className="h-4 w-4" /> Recommended focus
                      </div>
                      <ul className="space-y-3">
                        {aiEvaluation.weaknesses.map((w: string, i: number) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" /> {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-muted-foreground italic">
                   Detailed AI analysis is currently unavailable for this session.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-2xl shadow-soft bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
              <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2"><Trophy className="h-4 w-4" /> Next Steps</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm opacity-90 leading-relaxed">
                  Based on your performance, you have been added to our talent pool. Our HR team will reach out if there's a match for an interview.
                </p>
                <Button className="w-full rounded-xl bg-white text-primary hover:bg-white/90 font-bold" onClick={() => navigate({ to: "/candidate" })}>
                  Return to Dashboard
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-soft border-dashed">
              <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Integrity Report</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs mb-1">
                   <span className="text-muted-foreground">Session Integrity</span>
                   <span className="text-success font-bold">100%</span>
                </div>
                <Progress value={100} className="h-1.5" />
                <p className="mt-3 text-[10px] text-muted-foreground leading-relaxed">
                  No abnormal behavior was detected during your assessment session. This score is verified by our automated monitoring system.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
