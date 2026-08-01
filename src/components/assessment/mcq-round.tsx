import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Send, Loader2 } from "lucide-react";
import { assessmentApi, unwrapData } from "@/lib/api";

export function MCQRound({ assessmentId, onComplete }: { assessmentId: string; onComplete: () => void }) {
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
    }),
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
