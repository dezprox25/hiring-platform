import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Clock, ChevronLeft, ChevronRight, Play, Send, Terminal, CheckCircle2, XCircle, Loader2, Save, AlertTriangle } from "lucide-react";
import Editor from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assessmentApi, candidatesApi, unwrapData } from "@/lib/api";
import { socketService } from "@/lib/socket";

import { toast } from "sonner";

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

function MCQRound({ assessmentId, onComplete }: { assessmentId: string; onComplete: () => void }) {
  const queryClient = useQueryClient();
  const [idx, setIdx] = useState(0);
  const [ans, setAns] = useState<Record<string, number>>({});
  
  const { data: questions, isLoading } = useQuery({
    queryKey: ["assessment", assessmentId, "mcq"],
    queryFn: async () => unwrapData(await assessmentApi.getMcqQuestions(assessmentId)),
  });

  const submitMutation = useMutation({
    mutationFn: () => assessmentApi.saveMcqAnswer(assessmentId, {
      answers: Object.entries(ans).map(([qId, val]) => ({ questionId: qId, selectedOption: val.toString() }))
    } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment", assessmentId] });
      onComplete();
    }
  });

  if (isLoading || !questions) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  const q = questions[idx];
  const answered = Object.keys(ans).length;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
      <Card className="rounded-2xl shadow-soft border-primary/10">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-lg">Question {idx + 1} of {questions.length}</CardTitle>
            <Progress value={((idx + 1) / questions.length) * 100} className="mt-2 h-1.5 w-48" />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-base font-medium leading-relaxed">{q.text}</p>
          {q.codeStarter && (
            <pre className="mt-4 rounded-lg bg-muted p-4 font-mono text-xs overflow-x-auto border">
              <code>{q.codeStarter}</code>
            </pre>
          )}
          <div className="mt-8 space-y-3">
            {q.options.map((o: string, i: number) => {
              const sel = ans[q.id] === i;
              return (
                <button key={i} onClick={() => setAns({ ...ans, [q.id]: i })}
                  className={`w-full rounded-xl border p-4 text-left text-sm transition-all group ${sel ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:border-primary/40 hover:bg-muted/40"}`}>
                  <div className="flex items-center gap-4">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${sel ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"}`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className={sel ? "font-medium" : ""}>{o}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-8 flex items-center justify-between border-t pt-6">
            <Button variant="outline" className="rounded-xl px-6" disabled={idx === 0} onClick={() => setIdx(idx - 1)}><ChevronLeft className="mr-2 h-4 w-4" /> Previous</Button>
            <Button className="rounded-xl px-8" disabled={idx === questions.length - 1} onClick={() => setIdx(idx + 1)}>Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-soft h-fit sticky top-6">
        <CardHeader className="pb-3"><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Question palette</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((qq: any, i: number) => (
              <button key={qq.id} onClick={() => setIdx(i)}
                className={`flex h-10 items-center justify-center rounded-lg border text-xs font-bold transition-all ${i === idx ? "border-primary bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20" : ans[qq.id] !== undefined ? "border-success/40 bg-success/15 text-success" : "border-border bg-background text-muted-foreground hover:border-primary/40"}`}>
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mt-6 space-y-2 rounded-xl bg-muted/30 p-3 text-xs border">
            <div className="flex justify-between"><span>Answered:</span> <span className="font-bold text-foreground">{answered}</span></div>
            <div className="flex justify-between"><span>Remaining:</span> <span className="font-bold text-foreground">{questions.length - answered}</span></div>
          </div>
          <Button 
            className="mt-6 w-full rounded-xl shadow-lg shadow-primary/20" 
            disabled={submitMutation.isPending}
            onClick={() => { if(confirm("Submit MCQ section?")) submitMutation.mutate(); }}
          >
            {submitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Submit section
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function TypingRound({ assessmentId, onComplete }: { assessmentId: string; onComplete: () => void }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  
  const { data: passage, isLoading } = useQuery({
    queryKey: ["assessment", assessmentId, "typing"],
    queryFn: async () => unwrapData(await assessmentApi.getTypingPassage(assessmentId)),
  });

  const submitMutation = useMutation({
    mutationFn: (payload: any) => assessmentApi.saveTypingResult(assessmentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment", assessmentId] });
      onComplete();
    }
  });

  const target = passage?.text || "";
  const stats = useMemo(() => {
    const elapsed = startTime ? (Date.now() - startTime) / 1000 / 60 : 0;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const wpm = elapsed > 0 ? Math.round(words / elapsed) : 0;
    let correct = 0;
    for (let i = 0; i < text.length; i++) if (text[i] === target[i]) correct++;
    const acc = text.length > 0 ? Math.round((correct / text.length) * 100) : 100;
    const mistakes = text.length - correct;
    const progress = Math.min(100, (text.length / (target.length || 1)) * 100);
    return { wpm, acc, mistakes, progress };
  }, [text, startTime, target]);

  const handleFinish = useCallback(() => {
    const timeTaken = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    submitMutation.mutate({
      wpm: stats.wpm,
      accuracy: stats.acc,
      mistakes: stats.mistakes,
      text: text,
      timeTakenSeconds: timeTaken
    });
  }, [stats, text, startTime, submitMutation]);

  if (isLoading || !passage) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_240px]">
      <Card className="rounded-2xl shadow-soft border-primary/10">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-lg">Typing Test</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-xl border bg-muted/40 p-6 font-mono text-lg leading-relaxed select-none">
            {target.split("").map((ch, i) => {
              const typed = text[i];
              const cls = typed == null ? "text-muted-foreground/50" : typed === ch ? "text-foreground" : "bg-destructive/20 text-destructive border-b-2 border-destructive";
              return <span key={i} className={cls}>{ch}</span>;
            })}
          </div>
          <textarea
            value={text}
            onChange={(e) => { 
              if (!startTime) setStartTime(Date.now()); 
              const val = e.target.value.slice(0, target.length);
              setText(val);
              if (val.length === target.length) handleFinish();
            }}
            placeholder="Start typing the passage above…"
            className="mt-6 h-40 w-full resize-none rounded-xl border-2 bg-background p-5 text-base font-mono outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
            autoFocus
          />
          <div className="mt-4 flex items-center gap-4">
            <Progress value={stats.progress} className="h-2 flex-1" />
            <span className="text-xs font-bold text-muted-foreground tabular-nums">{Math.round(stats.progress)}%</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
        {[
          { l: "WPM", v: stats.wpm, icon: Clock },
          { l: "Accuracy", v: `${stats.acc}%`, icon: CheckCircle2 },
          { l: "Mistakes", v: stats.mistakes, icon: XCircle },
          { l: "Progress", v: `${Math.round(stats.progress)}%`, icon: Progress },
        ].map((s) => (
          <Card key={s.l} className="rounded-2xl shadow-soft overflow-hidden border-primary/5">
            <CardContent className="p-5">
              <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{s.l}</div>
              <div className="mt-2 text-3xl font-black tabular-nums text-primary">{s.v}</div>
            </CardContent>
          </Card>
        ))}
        <Button 
          className="mt-2 w-full rounded-xl h-14 font-bold shadow-lg shadow-primary/20"
          onClick={handleFinish}
          disabled={submitMutation.isPending || text.length < 10}
        >
          {submitMutation.isPending ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Finish test
        </Button>
      </div>
    </div>
  );
}

function CodingRound({ assessmentId, onComplete }: { assessmentId: string; onComplete: () => void }) {
  const queryClient = useQueryClient();
  const [lang, setLang] = useState<string>("javascript");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const { data: problem, isLoading } = useQuery({
    queryKey: ["assessment", assessmentId, "coding"],
    queryFn: async () => unwrapData(await assessmentApi.getCodingQuestion(assessmentId)),
  });

  useEffect(() => {
    if (problem) {
      setLang(problem.language);
      setCode(problem.codeStarter || "");
    }
  }, [problem]);

  const autosaveMutation = useMutation({
    mutationFn: (val: string) => assessmentApi.saveCodingAutosave(assessmentId, { code: val, language: lang }),
    onSuccess: () => {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    },
    onError: () => {
      toast.error("Autosave failed", { 
        description: "Your recent changes couldn't be saved to the cloud. Please check your connection.",
        action: {
          label: "Retry",
          onClick: () => autosaveMutation.mutate(code)
        }
      });
    }
  });

  const submitMutation = useMutation({
    mutationFn: () => assessmentApi.submitCoding(assessmentId, { code, language: lang }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment", assessmentId] });
      onComplete();
      toast.success("Coding round submitted successfully");
    },
    onError: (error: any) => {
      toast.error("Submission failed", { 
        description: error.response?.data?.message || "There was an error submitting your code. Please try again." 
      });
    }
  });

  // Autosave interval
  useEffect(() => {
    const i = setInterval(() => {
      if (code && !submitMutation.isPending) autosaveMutation.mutate(code);
    }, 30000);
    return () => clearInterval(i);
  }, [code, lang]);

  if (isLoading || !problem) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="rounded-2xl shadow-soft border-primary/10 overflow-y-auto max-h-[700px]">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4 sticky top-0 bg-background/95 backdrop-blur z-10">
          <div>
            <CardTitle className="flex items-center gap-3 text-xl">{problem.title}
              <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/5 text-primary text-[10px] uppercase font-bold tracking-tighter">{problem.difficulty}</Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{problem.description}</p>
          </div>
          
          <div className="mt-8 space-y-6">
            <div>
              <div className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Examples</div>
              <div className="space-y-3">
                {problem.examples?.map((e: any, i: number) => (
                  <div key={i} className="rounded-xl border-2 border-muted bg-muted/20 p-4 font-mono text-xs">
                    <div className="flex gap-2"><span className="text-primary font-bold">Input:</span> <code className="text-foreground">{e.input}</code></div>
                    <div className="mt-2 flex gap-2"><span className="text-success font-bold">Output:</span> <code className="text-foreground">{e.output}</code></div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Constraints</div>
              <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
                {problem.constraints?.map((c: string, i: number) => <li key={i}>{c}</li>)}
                {!problem.constraints && <li>No specific constraints provided.</li>}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <Card className="rounded-2xl shadow-soft overflow-hidden border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 py-3">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="rounded-lg px-3 py-1 font-mono uppercase text-[10px]">{lang}</Badge>
              <AnimatePresence>
                {isSaved && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-[10px] font-medium text-success">
                    <Save className="h-3 w-3" /> Saved to cloud
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="rounded-xl h-9 px-4 border-primary/20 hover:bg-primary/5" onClick={() => setOutput("> Testing functionality is disabled in live mode.\nPlease use 'Submit' to finish the round.")} disabled={running}>
                <Play className="mr-2 h-3.5 w-3.5" /> Run
              </Button>
              <Button 
                size="sm" 
                className="rounded-xl h-9 px-6 shadow-md shadow-primary/20"
                onClick={() => { if(confirm("Final submission for coding?")) submitMutation.mutate(); }}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-2 h-3.5 w-3.5" />}
                Submit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Editor
              height="450px"
              language={lang}
              value={code}
              onChange={(v) => setCode(v ?? "")}
              theme={typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "vs-dark" : "light"}
              options={{ 
                minimap: { enabled: false }, 
                fontSize: 14, 
                padding: { top: 20, bottom: 20 }, 
                lineNumbers: "on",
                roundedSelection: true,
                scrollBeyondLastLine: false,
                fontFamily: "JetBrains Mono, monospace"
              }}
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft border-primary/10">
          <CardHeader className="border-b bg-muted/20 py-2.5"><CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground"><Terminal className="h-3.5 w-3.5" /> Console Output</CardTitle></CardHeader>
          <CardContent className="p-0">
            <pre className="max-h-32 overflow-auto bg-black p-4 font-mono text-[11px] leading-relaxed text-green-400">{output || "> IDE initialized. Ready for input."}</pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
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

    socket.on('timer:tick', (payload: { secondsRemaining: number }) => {
      setTimerSeconds(payload.secondsRemaining);
    });

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
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
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
