import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList,
  CalendarClock,
  Trophy,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { candidatesApi, reportsApi, unwrapData } from "@/lib/api";
import { isAxiosError } from "axios";
import { getAuthFirstName, getStoredAuthUser } from "@/lib/auth-user";

export const Route = createFileRoute("/candidate/")({
  head: () => ({ meta: [{ title: "Candidate · Dezprox" }] }),
  component: CandidateDashboard,
});

function CandidateDashboard() {
  const firstName = getAuthFirstName(getStoredAuthUser(), "candidate");

  const {
    data: candidate,
    isLoading: candidateLoading,
    isError: candidateError,
    refetch: refetchCandidate,
  } = useQuery({
    queryKey: ["candidate", "me"],
    queryFn: async () => unwrapData(await candidatesApi.findMe()),
    retry: 2,
    refetchInterval: (q) => {
      const st = q.state.data?.assessment?.status as string | undefined;
      if (!st || st === "completed" || st === "not_started") return false;
      return 8000;
    },
  });

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ["reports", "my-report"],
    queryFn: async () => {
      try {
        return unwrapData(await reportsApi.findMyReport());
      } catch (e) {
        if (isAxiosError(e) && (e.response?.status === 400 || e.response?.status === 404)) {
          return { unavailable: true as const };
        }
        throw e;
      }
    },
    retry: false,
    staleTime: 60_000,
  });

  const assessment = candidate?.assessment;
  const status = assessment?.status as string | undefined;
  const isAssessmentActive = !!assessment && status && status !== "completed" && status !== "not_started";

  const progressMap: Record<string, { value: number; label: string }> = {
    not_started: { value: 0, label: "0 of 3 sections" },
    round_1: { value: 33, label: "1 of 3 sections" },
    round_2: { value: 66, label: "2 of 3 sections" },
    round_3: { value: 90, label: "Final section" },
    completed: { value: 100, label: "Completed" },
  };

  const progress = progressMap[status || "not_started"] ?? progressMap.not_started;

  const released = report && "released" in report && report.released === true;
  const scoreDisplay =
    released && "totalScore" in report && report.totalScore != null ? `${Number(report.totalScore).toFixed(0)}%` : "—";

  return (
    <DashboardLayout role="candidate" title="Dashboard">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Hi {firstName} 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your hiring journey at Dezprox.</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => refetchCandidate()} disabled={candidateLoading}>
          <RefreshCw className={`mr-1.5 h-4 w-4 ${candidateLoading ? "animate-spin" : ""}`} />
          Sync progress
        </Button>
      </div>

      {candidateError && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Could not load your profile. Please refresh the page.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-elegant overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card lg:col-span-2">
          <CardContent className="p-6">
            {candidateLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isAssessmentActive ? (
              <>
                <Badge variant="secondary" className="rounded-full">
                  Active assessment
                </Badge>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">{candidate?.roleApplied}</h2>
                <p className="mt-1 text-sm text-muted-foreground">Holistic technical evaluation · progress syncs automatically</p>

                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium uppercase tracking-wider text-muted-foreground">Current progress</span>
                    <span className="font-bold text-primary">{progress.label}</span>
                  </div>
                  <Progress value={progress.value} className="mt-2 h-2" />
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Status: <span className="font-mono uppercase">{status}</span> · updates every few seconds while in progress
                  </p>
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/candidate/assessment">
                    <Button className="rounded-xl px-8 shadow-lg shadow-primary/20">
                      Resume assessment <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="outline" className="rounded-xl" type="button">
                    View instructions
                  </Button>
                </div>
              </>
            ) : status === "completed" ? (
              <div className="py-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold">Assessment completed</h2>
                <p className="mt-1 text-sm text-muted-foreground">We are reviewing your submission. You will be notified via email.</p>
                <div className="mt-6 flex justify-center gap-3">
                  <Link to="/candidate/results">
                    <Button className="rounded-xl">View my results</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <AlertCircle className="mx-auto mb-4 h-12 w-12 opacity-20" />
                <p>No assessment assigned to your profile yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" /> Application status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div
                  className={`h-3 w-3 rounded-full ${candidate?.status === "REJECTED" ? "bg-destructive" : candidate?.status === "HIRED" ? "bg-success animate-none" : "animate-pulse bg-primary"}`}
                />
                <div className="text-sm font-bold uppercase tracking-widest">{candidate?.status || "—"}</div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Last updated: {candidate?.updatedAt ? new Date(candidate.updatedAt).toLocaleString() : "—"}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning-foreground" /> Important
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>• Use Chrome or Firefox in fullscreen mode.</p>
              <p>• Tab switching and window blurring is monitored.</p>
              <p>• Coding submissions are final once submitted.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="rounded-2xl shadow-soft">
          <CardContent className="p-5">
            <ClipboardList className="h-5 w-5 text-primary" />
            <div className="mt-3 text-2xl font-black tabular-nums">{isAssessmentActive ? "1" : "0"}</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pending tasks</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-soft">
          <CardContent className="p-5">
            <Trophy className="h-5 w-5 text-warning-foreground" />
            <div className="mt-3 text-2xl font-black tabular-nums">
              {reportLoading ? <Skeleton className="h-8 w-16" /> : scoreDisplay}
            </div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {released ? "Released score" : "Results visibility"}
            </div>
            {!released && !reportLoading && (
              <p className="mt-2 text-[10px] text-muted-foreground">
                {report && "unavailable" in report && report.unavailable
                  ? "Results are not available until your assessment is complete and released."
                  : "Awaiting release from your hiring team."}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-soft">
          <CardContent className="p-5">
            <CalendarClock className="h-5 w-5 text-info" />
            <div className="mt-3 text-2xl font-black tabular-nums">0</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Interviews</div>
            <p className="mt-2 text-[10px] text-muted-foreground">Scheduled interviews will appear here when added by HR.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
