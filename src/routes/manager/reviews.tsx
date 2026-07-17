import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aiEvaluationApi, assessmentApi, reportsApi, unwrapData } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Brain,
  ChevronRight,
  Search,
  ChevronDown,
  Sparkles,
  Star,
  GitBranch,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Editor } from "@monaco-editor/react";
import type { ReportDetailResponse } from "@/types/api";
import { isAxiosError } from "axios";

export const Route = createFileRoute("/manager/reviews")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: (search.id as string) || undefined,
  }),
  component: ReviewsPage,
});

function ReviewsPage() {
  const { id } = useSearch({ from: "/manager/reviews" });
  return (
    <DashboardLayout role="manager" title="Reviews">
      {id ? <ReviewDetail id={id} /> : <ReviewList />}
    </DashboardLayout>
  );
}

type FilterKey = "all" | "shortlisted" | "pending_ai";

function ReviewList() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["reports", "manager-queue", { page, filter }],
    queryFn: async () =>
      unwrapData(
        await reportsApi.findAll({
          page,
          limit,
          isShortlisted: filter === "shortlisted" ? true : undefined,
        }),
      ),
    placeholderData: (prev) => prev,
    retry: 2,
  });

  const items = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((r: Record<string, string | number | null | undefined>) => {
      const name = String(r.candidateFullName ?? "").toLowerCase();
      const role = String(r.roleApplied ?? "").toLowerCase();
      const matchQ = !q || name.includes(q) || role.includes(q);
      const pendingAi = r.codingAiScore == null;
      if (filter === "pending_ai") return matchQ && pendingAi;
      return matchQ;
    });
  }, [items, search, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Review queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Engineering assessments awaiting technical evaluation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search candidates..."
              className="w-64 rounded-xl pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filter} onValueChange={(v) => { setFilter(v as FilterKey); setPage(1); }}>
            <SelectTrigger className="w-[160px] rounded-xl">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="shortlisted">Shortlisted</SelectItem>
              <SelectItem value="pending_ai">Pending AI</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="rounded-xl" onClick={() => refetch()} disabled={isFetching}>
            <Loader2 className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {isError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Failed to load the review queue.
        </div>
      )}

      <div className="grid gap-4">
        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
        ) : (
          filtered.map((r: any) => (
            <Card key={r.id} className="rounded-2xl border-l-4 border-l-primary/30 shadow-soft transition-all hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/5 font-bold text-primary">
                      {String(r.candidateFullName)
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{r.candidateFullName}</h3>
                      <Badge variant="outline" className="rounded-full text-[10px] uppercase">
                        {r.roleApplied}
                      </Badge>
                      {r.isShortlisted && (
                        <Badge className="rounded-full border border-primary/20 bg-primary/10 text-[10px] text-primary">
                          Shortlisted
                        </Badge>
                      )}
                      <Badge className="rounded-full border border-success/20 bg-success/10 text-[10px] text-success">
                        AI: {r.codingAiScore != null ? Number(r.codingAiScore).toFixed(0) : "Pending"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>Submitted {new Date(r.assessmentDate).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Code2 className="h-3 w-3" /> {r.codingLanguage ?? "—"}
                      </span>
                    </div>
                  </div>
                  <div className="mr-4 text-right">
                    <div className="text-xl font-black tabular-nums">{Number(r.totalScore).toFixed(0)}%</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total</div>
                  </div>
                  <Link to="/manager/reviews" search={{ id: r.id }}>
                    <Button className="rounded-xl">
                      Start review <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">
            <Search className="mx-auto mb-4 h-12 w-12 opacity-20" />
            <p>No candidates match your filters.</p>
          </div>
        )}
      </div>

      {total > limit && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {page} of {totalPages} · {total} total
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-lg" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [managerScore, setManagerScore] = useState(80);
  const [feedback, setFeedback] = useState("");
  const [recommendation, setRecommendation] = useState<"hire" | "reject" | "hold">("hold");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: report, isLoading: reportLoading, isError: reportError } = useQuery({
    queryKey: ["reports", id],
    queryFn: async () => unwrapData<ReportDetailResponse>(await reportsApi.findById(id)),
    retry: 1,
  });

  const assessmentId = report?.assessment?.id;

  const { data: submission, isLoading: submissionLoading } = useQuery({
    queryKey: ["assessments", assessmentId, "coding-submission"],
    queryFn: async () => unwrapData(await assessmentApi.getCodingSubmission(assessmentId!)),
    enabled: !!assessmentId,
    retry: 1,
  });

  const alreadyReviewed = Boolean(submission?.managerReviewedAt ?? report?.scores?.coding?.score != null);

  const reviewMutation = useMutation({
    mutationFn: (data: { managerScore: number; managerFeedback: string }) =>
      assessmentApi.submitManagerReview(assessmentId!, data).then((res) => unwrapData(res)),
    onSuccess: () => {
      toast.success("Review finalized");
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["assessments", assessmentId, "coding-submission"] });
      navigate({ to: "/manager/reviews" });
    },
    onError: (err: unknown) => {
      const msg = isAxiosError(err) ? err.response?.data?.message : undefined;
      toast.error("Could not finalize review", { description: msg || "Please try again." });
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: (input: {
      recommendation: "hire" | "reject" | "hold";
      overallRating: number;
      technicalComment?: string;
    }) =>
      reportsApi
        .addFeedback(id, {
          overallRating: input.overallRating,
          technicalComment: input.technicalComment,
          recommendation: input.recommendation,
        })
        .then((res) => unwrapData(res)),
    onSuccess: () => {
      toast.success("Recommendation saved");
      queryClient.invalidateQueries({ queryKey: ["reports", id] });
    },
    onError: (err: unknown) => {
      const msg = isAxiosError(err) ? err.response?.data?.message : undefined;
      toast.error("Could not save recommendation", { description: msg || "You may have already submitted feedback." });
    },
  });

  const retriggerMutation = useMutation({
    mutationFn: () =>
      aiEvaluationApi.retrigger(report!.candidate.id, { force: true }).then((res) => unwrapData(res)),
    onSuccess: () => {
      toast.success("AI re-evaluation requested");
      queryClient.invalidateQueries({ queryKey: ["reports", id] });
    },
    onError: (err: unknown) => {
      const msg = isAxiosError(err) ? err.response?.data?.message : undefined;
      toast.error("Re-evaluation failed", { description: msg });
    },
  });

  if (reportLoading || submissionLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-[600px] rounded-2xl lg:col-span-2" />
          <Skeleton className="h-[600px] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (reportError || !report) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" className="rounded-xl" onClick={() => navigate({ to: "/manager/reviews" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to queue
        </Button>
        <Card className="rounded-2xl p-8 text-center text-sm text-muted-foreground">Report could not be loaded.</Card>
      </div>
    );
  }

  const ai = report.aiEvaluation;
  const lang = (submission?.language || report.scores.coding.language || "typescript").toLowerCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" className="rounded-xl" onClick={() => navigate({ to: "/manager/reviews" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to queue
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="rounded-full px-3 py-1">
            ID: {id.slice(0, 8)}
          </Badge>
          <Badge className="rounded-full border-primary/20 bg-primary/10 text-primary">
            {alreadyReviewed ? "Review complete" : "Awaiting manager review"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden rounded-2xl border-t-4 border-t-primary shadow-soft">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar className="h-16 w-16 text-xl font-bold">
                  <AvatarFallback className="bg-primary/5 text-primary">
                    {report.candidate.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{report.candidate.fullName}</h2>
                  <p className="text-muted-foreground">
                    {report.candidate.roleApplied} · {report.candidate.email}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-3xl font-black tabular-nums text-primary">{Number(report.scores.total).toFixed(0)}%</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total score</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl shadow-soft">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between border-b bg-muted/30 py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Code2 className="h-4 w-4" /> Coding submission
              </CardTitle>
              <Badge variant="secondary" className="rounded-full">
                {lang}
              </Badge>
            </CardHeader>
            <CardContent className="h-[500px] p-0">
              <Editor
                height="100%"
                language={lang}
                value={submission?.code || "// No code submitted"}
                theme="vs-dark"
                loading={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading editor…</div>}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  padding: { top: 20 },
                  scrollBeyondLastLine: false,
                }}
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft">
            <Collapsible defaultOpen>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 py-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Brain className="h-4 w-4 text-primary" /> AI technical evaluation
                </CardTitle>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="rounded-lg">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="space-y-6 border-t pt-4">
                  {ai ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {[
                          { label: "Logic", val: ai.codingAnalysis.logic, color: "text-success" },
                          { label: "Readability", val: ai.codingAnalysis.readability, color: "text-info" },
                          { label: "Structure", val: ai.codingAnalysis.structure, color: "text-primary" },
                          { label: "Clarity", val: ai.communicationAnalysis.clarity, color: "text-warning" },
                        ].map((s) => (
                          <div key={s.label} className="rounded-xl border bg-card/50 p-3">
                            <div className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">{s.label}</div>
                            <div className={`text-lg font-bold ${s.color}`}>{s.val}/100</div>
                          </div>
                        ))}
                      </div>

                      {ai.summary && (
                        <div className="rounded-xl border-l-4 border-primary/30 bg-primary/5 p-4 text-sm italic">
                          &ldquo;{ai.summary}&rdquo;
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                          <div className="mb-3 flex items-center gap-1 text-xs font-black uppercase tracking-widest text-success">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Strengths
                          </div>
                          <ul className="space-y-2">
                            {ai.strengths.map((s: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-success" /> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="mb-3 flex items-center gap-1 text-xs font-black uppercase tracking-widest text-warning-foreground">
                            <AlertTriangle className="h-3.5 w-3.5" /> Areas to probe
                          </div>
                          <ul className="space-y-2">
                            {ai.weaknesses.map((w: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-warning-foreground" /> {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">AI analysis was not generated for this submission.</p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          <Card className="rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Assessment performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "MCQ knowledge", score: report.scores.mcq.percentage, icon: CheckCircle2, color: "text-success" },
                { label: "Typing accuracy", score: report.scores.typing.accuracy, icon: CheckCircle2, color: "text-info" },
                {
                  label: "AI coding",
                  score: report.scores.coding.aiScore ?? 0,
                  icon: Brain,
                  color: "text-primary",
                },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <r.icon className={`h-3.5 w-3.5 ${r.color}`} />
                    <span className="text-xs font-medium">{r.label}</span>
                  </div>
                  <span className="text-xs font-bold">{Number(r.score).toFixed(0)}%</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-elegant sticky top-6 rounded-2xl border-2 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="h-4 w-4 text-primary" /> Technical review
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Manager score</span>
                  <span data-testid="manager-score-display" className="text-2xl font-black text-primary tabular-nums">{managerScore}%</span>
                </div>
                <input
                  data-testid="manager-score-slider"
                  type="range"
                  min={0}
                  max={100}
                  className="accent-primary h-2 w-full cursor-pointer appearance-none rounded-full bg-muted"
                  value={managerScore}
                  onChange={(e) => setManagerScore(parseInt(e.target.value, 10))}
                  disabled={alreadyReviewed}
                />
              </div>

              <div className="space-y-2">
                <span className="text-sm font-semibold">Recommendation</span>
                <Select
                  value={recommendation}
                  onValueChange={(v) => setRecommendation(v as typeof recommendation)}
                  disabled={alreadyReviewed}
                >
                  <SelectTrigger data-testid="recommendation-select" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hire">Hire</SelectItem>
                    <SelectItem value="hold">Hold</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-semibold">Technical feedback</span>
                <Textarea
                  data-testid="manager-feedback"
                  placeholder="Evaluation of code quality, logic, and problem solving…"
                  className="min-h-[160px] resize-none rounded-xl text-sm"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  disabled={alreadyReviewed}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl"
                  disabled={feedbackMutation.isPending || alreadyReviewed}
                  onClick={() => {
                    setRecommendation("hire");
                    feedbackMutation.mutate({
                      recommendation: "hire",
                      overallRating: 5,
                      technicalComment: feedback.trim() || "Approve signal",
                    });
                  }}
                >
                  <ThumbsUp className="mr-1 h-4 w-4" /> Approve signal
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl"
                  disabled={feedbackMutation.isPending || alreadyReviewed}
                  onClick={() => {
                    setRecommendation("reject");
                    feedbackMutation.mutate({
                      recommendation: "reject",
                      overallRating: 1,
                      technicalComment: feedback.trim() || "Reject signal",
                    });
                  }}
                >
                  <ThumbsDown className="mr-1 h-4 w-4" /> Reject signal
                </Button>
              </div>

              <Button
                type="button"
                variant="secondary"
                className="w-full rounded-xl"
                disabled={retriggerMutation.isPending || !report.candidate.id}
                onClick={() => retriggerMutation.mutate()}
              >
                {retriggerMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                Request AI re-evaluation
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl"
                disabled={!feedback.trim() || feedbackMutation.isPending || alreadyReviewed}
                onClick={() =>
                  feedbackMutation.mutate({
                    recommendation,
                    overallRating: recommendation === "hire" ? 5 : recommendation === "reject" ? 1 : 3,
                    technicalComment: feedback.trim() || undefined,
                  })
                }
              >
                {feedbackMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Submit feedback
              </Button>

              <Button
                data-testid="finalize-review-button"
                className="w-full rounded-xl h-12 font-bold shadow-lg shadow-primary/20"
                disabled={!feedback.trim() || alreadyReviewed || reviewMutation.isPending}
                onClick={() => setConfirmOpen(true)}
              >
                {reviewMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Finalize review
              </Button>

              <div className="rounded-xl bg-muted/30 p-4 text-[10px] leading-relaxed text-muted-foreground">
                Finalizing records your manager score and locks this review. Use &ldquo;Submit feedback&rdquo; for hire / hold / reject
                recommendation without final coding scores.
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <GitBranch className="h-4 w-4" /> Prior manager notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              {report.feedback?.length ? (
                report.feedback.map((f) => (
                  <div key={f.id} className="rounded-lg border p-3">
                    <div className="font-semibold text-foreground">{f.manager}</div>
                    <div className="mt-1 whitespace-pre-wrap">{f.content}</div>
                    <div className="mt-1 text-[10px] uppercase">Rating {f.rating}/5</div>
                  </div>
                ))
              ) : (
                <p>No prior feedback on this report.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Finalize technical review?</AlertDialogTitle>
            <AlertDialogDescription>
              This submits your manager score and technical notes to the assessment record. You cannot submit twice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl"
              onClick={() => {
                reviewMutation.mutate({ managerScore, managerFeedback: feedback });
                setConfirmOpen(false);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
