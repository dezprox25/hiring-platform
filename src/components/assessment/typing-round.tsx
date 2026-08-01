import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle2, XCircle, Send, Loader2 } from "lucide-react";
import { assessmentApi, unwrapData } from "@/lib/api";

export function TypingRound({ assessmentId, onComplete }: { assessmentId: string; onComplete: () => void }) {
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
