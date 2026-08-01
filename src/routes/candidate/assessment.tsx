import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { Clock, Play, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { assessmentApi, candidatesApi, unwrapData } from "@/lib/api";
import { socketService } from "@/lib/socket";
import { toast } from "sonner";
import { MCQRound } from "@/components/assessment/mcq-round";
import { TypingRound } from "@/components/assessment/typing-round";
import { CodingRound } from "@/components/assessment/coding-round";

export const Route = createFileRoute("/candidate/assessment")({
  head: () => ({ meta: [{ title: "Assessment · Dezprox" }] }),
  component: Assessment,
});

function useAssessmentTimer(initialSeconds: number, onTimeUp?: () => void) {
  const [seconds, setSeconds] = useState(initialSeconds);
  
  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (seconds <= 0) return;
    const i = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(i);
          onTimeUp?.();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [seconds === initialSeconds, onTimeUp]);

  const m = Math.floor(seconds / 60), s = seconds % 60;
  return {
    display: `${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`,
    seconds,
    setSeconds
  };
}

function Assessment() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [antiCheatWarnings, setAntiCheatWarnings] = useState(0);

  // 1. Fetch Candidate profile to get assessmentId
  const { data: candidate, isLoading: isCandidateLoading } = useQuery({
    queryKey: ["candidate-me"],
    queryFn: async () => unwrapData(await candidatesApi.findMe()),
  });

  useEffect(() => {
    if (candidate?.assessment?.id) {
      setAssessmentId(candidate.assessment.id);
    }
  }, [candidate]);

  // 2. Fetch Assessment State
  const { data: assessment, isLoading: isAssessmentLoading, refetch: refetchStatus } = useQuery({
    queryKey: ["assessment", assessmentId],
    queryFn: async () => unwrapData(await assessmentApi.getAssessmentStatus(assessmentId!)),
    enabled: !!assessmentId,
  });

  const { display: timerDisplay, setSeconds: setTimerSeconds } = useAssessmentTimer(assessment?.timeRemaining || 0, () => {
    // Handle time up logic locally if needed, though socket will force submit
  });

  // 3. Socket.IO Realtime Setup
  useEffect(() => {
    if (!assessmentId || assessment?.status === "completed") return;

    const socket = socketService.connect();
    
    socket.on('disconnect', (reason) => {
      setSocketConnected(false);
      if (reason === "io server disconnect") {
        // the disconnection was initiated by the server, you need to reconnect manually
        socket.connect();
      }
      toast.warning("Connection lost", { 
        description: "Attempting to restore live synchronization...",
        duration: 3000
      });
    });

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('assessment:join', { assessmentId });
      toast.success("Live connection restored");
    });

    socket.on('assessment:joined', (payload: { status: string; secondsRemaining: number }) => {
      if (typeof payload.secondsRemaining === 'number') {
        setTimerSeconds(payload.secondsRemaining);
      }
    });

    socket.on('timer:tick', (payload: { secondsRemaining: number }) => {
      if (typeof payload.secondsRemaining === 'number') {
        setTimerSeconds(payload.secondsRemaining);
      }
    });

    // Periodic server-authoritative timer synchronization every 15 seconds
    const syncInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('timer:request', { assessmentId });
      }
    }, 15000);

    socket.on('round:advanced', () => {
      queryClient.invalidateQueries({ queryKey: ["assessment", assessmentId] });
      refetchStatus();
    });

    socket.on('assessment:forcesubmit', () => {
      alert("Time is up! Your answers are being submitted automatically.");
      queryClient.invalidateQueries({ queryKey: ["assessment", assessmentId] });
      refetchStatus();
    });

    // 4. Anti-Cheat Logic
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setAntiCheatWarnings(prev => prev + 1);
        socket.emit('anticheat:violation', { 
          assessmentId, 
          type: 'TAB_SWITCH', 
          detail: 'User left the assessment tab' 
        });
      }
    };

    const handleBlur = () => {
      socket.emit('anticheat:violation', { 
        assessmentId, 
        type: 'WINDOW_BLUR', 
        detail: 'User clicked away from browser window' 
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      clearInterval(syncInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      socket.off('assessment:joined');
      socket.off('timer:tick');
      socket.off('round:advanced');
      socket.off('assessment:forcesubmit');
      socketService.disconnect();
    };
  }, [assessmentId, queryClient, refetchStatus, setTimerSeconds]);

  if (isCandidateLoading || isAssessmentLoading) {
    return (
      <DashboardLayout role="candidate" title="Assessment">
        <div className="flex h-[70vh] items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  if (!assessmentId) {
    return (
      <DashboardLayout role="candidate" title="Assessment">
        <Card className="mt-12 mx-auto max-w-md text-center rounded-3xl border-destructive/20 bg-destructive/5 p-8">
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-xl font-bold">No active assessment found</h2>
          <p className="mt-2 text-sm text-muted-foreground">Please contact support if you believe this is an error.</p>
        </Card>
      </DashboardLayout>
    );
  }

  if (assessment?.status === "completed") {
    return (
      <DashboardLayout role="candidate" title="Assessment Complete">
        <div className="mx-auto mt-12 max-w-2xl text-center">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-3xl bg-card p-12 shadow-soft border-2 border-primary/5">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h1 className="mt-8 text-3xl font-black tracking-tight">Assessment Submitted!</h1>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Thank you for completing the Dezprox technical assessment. Our team will review your results and get back to you via email within 48 hours.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="rounded-2xl px-8" onClick={() => navigate({ to: "/candidate" })}>Back to Dashboard</Button>
              <Button size="lg" variant="outline" className="rounded-2xl px-8">View My Profile</Button>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  const currentTab = 
    assessment?.status === "round_1" ? "mcq" :
    assessment?.status === "round_2" ? "typing" :
    assessment?.status === "round_3" ? "coding" : "mcq";

  return (
    <DashboardLayout role="candidate" title="Assessment">
      <div className="flex flex-col gap-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight md:text-4xl">{candidate?.roleApplied} · Assessment</h1>
            <div className="mt-2 flex items-center gap-3">
              <Badge data-testid="socket-status" variant="outline" className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${socketConnected ? "bg-success/10 text-success border-success/30" : "bg-warning/10 text-warning border-warning/30"}`}>
                <div className={`mr-2 h-2 w-2 rounded-full ${socketConnected ? "bg-success animate-pulse" : "bg-warning"}`} />
                {socketConnected ? "Live Connection" : "Reconnecting..."}
              </Badge>
              {antiCheatWarnings > 0 && (
                <Badge variant="destructive" className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                  <AlertTriangle className="mr-1.5 h-3 w-3" /> Anti-Cheat Warning
                </Badge>
              )}
            </div>
          </div>
          <Card className="rounded-2xl border-2 border-primary/20 bg-primary/5 px-6 py-4 shadow-lg shadow-primary/5">
            <div className="text-[10px] font-black uppercase tracking-widest text-primary/60">Time Remaining</div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <span data-testid="assessment-timer" className="text-3xl font-black tabular-nums text-primary">{timerDisplay}</span>
            </div>
          </Card>
        </motion.div>

        <div className="rounded-2xl bg-muted/30 p-1.5 border border-primary/5 shadow-inner">
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "round_1", label: "MCQ Section", tab: "mcq" },
              { id: "round_2", label: "Typing Test", tab: "typing" },
              { id: "round_3", label: "Coding Round", tab: "coding" },
            ].map((r) => {
              const isActive = assessment?.status === r.id;
              const isDone = ["round_2", "round_3", "completed"].includes(assessment?.status || "") && r.id === "round_1" || 
                             (["round_3", "completed"].includes(assessment?.status || "") && r.id === "round_2");
              
              return (
                <div key={r.id} className={`flex items-center justify-center rounded-xl py-3 text-xs font-bold transition-all ${isActive ? "bg-background text-primary shadow-sm border border-primary/10" : isDone ? "text-success opacity-70" : "text-muted-foreground opacity-50"}`}>
                  {isDone ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <div className={`mr-2 h-5 w-5 rounded-full border-2 flex items-center justify-center text-[10px] ${isActive ? "border-primary text-primary" : "border-muted-foreground"}`}>{r.id.split('_')[1]}</div>}
                  {r.label}
                </div>
              );
            })}
          </div>
        </div>

        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div 
              key={assessment?.status} 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {assessment?.status === "round_1" && <MCQRound assessmentId={assessmentId} onComplete={refetchStatus} />}
              {assessment?.status === "round_2" && <TypingRound assessmentId={assessmentId} onComplete={refetchStatus} />}
              {assessment?.status === "round_3" && <CodingRound assessmentId={assessmentId} onComplete={refetchStatus} />}
              {assessment?.status === "not_started" && (
                <Card className="mx-auto max-w-xl text-center rounded-3xl p-12 border-2 border-primary/10 shadow-xl">
                  <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-8">
                    <Play className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="text-3xl font-black">Ready to start?</h2>
                  <p className="mt-4 text-muted-foreground">This assessment consists of three sections. Once you start, the timer will begin and you must complete all sections in one sitting.</p>
                  <Button size="lg" className="mt-10 rounded-2xl h-14 px-12 text-lg font-bold shadow-lg shadow-primary/20" onClick={() => assessmentApi.startAssessment(assessmentId).then(() => refetchStatus())}>Start Assessment</Button>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
