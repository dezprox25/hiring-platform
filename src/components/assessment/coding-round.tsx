import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Send, Terminal, Loader2, Save } from "lucide-react";
import Editor from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";
import { assessmentApi, unwrapData } from "@/lib/api";
import { toast } from "sonner";

export function CodingRound({ assessmentId, onComplete }: { assessmentId: string; onComplete: () => void }) {
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
              <Button size="sm" variant="outline" className="rounded-xl h-9 px-4 border-primary/20 hover:bg-primary/5" onClick={() => { toast.info("Code Review Mode", { description: "Your code will be submitted for review and evaluation by our hiring team. Use 'Submit' when you're ready." }); }} disabled={running}>
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
