import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Filter, Loader2, AlertCircle, Trash2, Edit2, CheckCircle, Code, ListChecks } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { questionBankApi, unwrapData } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/questions")({
  head: () => ({ meta: [{ title: "Question Bank · Dezprox" }] }),
  component: Questions,
});

const diffColor: Record<string, string> = {
  easy: "bg-success/15 text-success border-success/30 font-bold",
  medium: "bg-warning/15 text-warning-foreground border-warning/30 font-bold",
  hard: "bg-destructive/15 text-destructive border-destructive/30 font-bold",
};

function Questions() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 25;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newType, setNewType] = useState<"MCQ" | "Coding">("MCQ");

  // MCQ Form State
  const [mcqText, setMcqText] = useState("");
  const [mcqTopic, setMcqTopic] = useState("General Engineering");
  const [mcqRole, setMcqRole] = useState("All Tracks");
  const [mcqDifficulty, setMcqDifficulty] = useState("medium");
  const [options, setOptions] = useState<[string, string, string, string]>(["Option A", "Option B", "Option C", "Option D"]);
  const [correctIndex, setCorrectIndex] = useState(0);

  // Coding Form State
  const [codingPrompt, setCodingPrompt] = useState("");
  const [codingLang, setCodingLang] = useState("javascript");
  const [codingDifficulty, setCodingDifficulty] = useState("medium");

  const { data: mcqResponse, isLoading: isMcqLoading, isError: isMcqError } = useQuery({
    queryKey: ["questions", "mcq", { page, q }],
    queryFn: async () => unwrapData(await questionBankApi.getMcqQuestions({ page, limit, topic: q || undefined })),
    enabled: type === "MCQ" || type === "all",
  });

  const { data: codingResponse, isLoading: isCodingLoading, isError: isCodingError } = useQuery({
    queryKey: ["questions", "coding", { page, q }],
    queryFn: async () => unwrapData(await questionBankApi.getCodingQuestions({ page, limit })),
    enabled: type === "Coding" || type === "all",
  });

  const questions = useMemo(() => {
    let list: any[] = [];
    if (type === "MCQ" || type === "all") {
      const mcqs = mcqResponse?.data?.map((x: any) => ({
        ...x,
        type: "MCQ",
        title: x.questionText,
        category: x.topic || "MCQ Conceptual",
      })) || [];
      list = [...list, ...mcqs];
    }
    if (type === "Coding" || type === "all") {
      const codings = codingResponse?.data?.map((x: any) => ({
        ...x,
        type: "Coding",
        title: x.prompt,
        category: x.language || "Programming",
      })) || [];
      list = [...list, ...codings];
    }
    return list.filter((item) => {
      if (!q.trim()) return true;
      const term = q.toLowerCase();
      return item.title?.toLowerCase().includes(term) || item.category?.toLowerCase().includes(term);
    });
  }, [mcqResponse, codingResponse, type, q]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (newType === "MCQ") {
        if (!mcqText.trim()) throw new Error("Question text cannot be empty");
        const cleanOptions = options.map((o) => o.trim() || "Option");
        return unwrapData(
          await questionBankApi.createMcq({
            questionText: mcqText.trim(),
            options: cleanOptions,
            correctAnswer: cleanOptions[correctIndex],
            topic: mcqTopic.trim() || "General",
            roleApplied: mcqRole.trim() || "General",
            difficulty: mcqDifficulty,
          }),
        );
      } else {
        if (!codingPrompt.trim()) throw new Error("Coding prompt cannot be empty");
        return unwrapData(
          await questionBankApi.createCoding({
            prompt: codingPrompt.trim(),
            language: codingLang,
            difficulty: codingDifficulty,
          }),
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      toast.success("Question created", {
        description: `Added new ${newType} challenge to the centralized repository.`,
      });
      setDialogOpen(false);
      setMcqText("");
      setCodingPrompt("");
    },
    onError: (err: any) => {
      toast.error("Creation failed", { description: err?.message || err.response?.data?.message || "Check fields and retry." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (question: any) =>
      question.type === "MCQ" ? questionBankApi.deleteMcq(question.id) : questionBankApi.deleteCoding(question.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      toast.success("Question deleted from bank");
    },
  });

  const isLoading = isMcqLoading || isCodingLoading;
  const isError = isMcqError || isCodingError;

  return (
    <DashboardLayout role="admin" title="Question Bank">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Question & Challenge Bank</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Centralized repository of conceptual MCQs and technical coding problems utilized across evaluations.
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-11 px-5 font-bold shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]">
              <Plus className="mr-2 h-4 w-4" /> Create Question
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-xl border-primary/20 overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-xl font-black flex items-center gap-2">
                {newType === "MCQ" ? <ListChecks className="h-5 w-5 text-primary" /> : <Code className="h-5 w-5 text-primary" />}
                Add Evaluation Challenge
              </DialogTitle>
              <DialogDescription>Design a reusable question item for future assessment compositions.</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-5 py-2">
              <div className="grid grid-cols-2 gap-3 p-1 rounded-xl bg-muted/40 border">
                <button
                  type="button"
                  onClick={() => setNewType("MCQ")}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    newType === "MCQ" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ListChecks className="h-4 w-4" /> Multiple Choice (MCQ)
                </button>
                <button
                  type="button"
                  onClick={() => setNewType("Coding")}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    newType === "Coding" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Code className="h-4 w-4" /> Technical Coding
                </button>
              </div>

              {newType === "MCQ" ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Question Prompt</Label>
                    <Textarea
                      value={mcqText}
                      onChange={(e) => setMcqText(e.target.value)}
                      placeholder="e.g. What is the time complexity of searching an element in a self-balancing binary search tree?"
                      className="rounded-xl min-h-[90px] font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Topic Category</Label>
                      <Input value={mcqTopic} onChange={(e) => setMcqTopic(e.target.value)} className="rounded-xl h-10 text-xs font-bold" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Target Track</Label>
                      <Input value={mcqRole} onChange={(e) => setMcqRole(e.target.value)} className="rounded-xl h-10 text-xs font-bold" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Difficulty</Label>
                      <Select value={mcqDifficulty} onValueChange={setMcqDifficulty}>
                        <SelectTrigger className="rounded-xl h-10 font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-dashed">
                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      <span>Answer Options (Select radio for Correct Answer)</span>
                    </Label>
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCorrectIndex(idx)}
                          className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            correctIndex === idx ? "border-success bg-success text-white" : "border-muted-foreground/30 hover:border-primary"
                          }`}
                        >
                          {correctIndex === idx && <CheckCircle className="h-4 w-4" />}
                        </button>
                        <Input
                          value={opt}
                          onChange={(e) => {
                            const copy = [...options] as [string, string, string, string];
                            copy[idx] = e.target.value;
                            setOptions(copy);
                          }}
                          className={`rounded-xl flex-1 h-10 text-sm ${correctIndex === idx ? "border-success font-bold bg-success/5" : ""}`}
                          placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Problem Specification & Requirements</Label>
                    <Textarea
                      value={codingPrompt}
                      onChange={(e) => setCodingPrompt(e.target.value)}
                      placeholder="Write a detailed technical challenge specification including input parameters, expected return values, and edge cases to consider..."
                      className="rounded-xl min-h-[140px] font-mono text-sm leading-relaxed"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Target Language</Label>
                      <Select value={codingLang} onValueChange={setCodingLang}>
                        <SelectTrigger className="rounded-xl h-11 font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl font-bold">
                          <SelectItem value="javascript">JavaScript (Node.js)</SelectItem>
                          <SelectItem value="typescript">TypeScript</SelectItem>
                          <SelectItem value="python">Python 3</SelectItem>
                          <SelectItem value="java">Java Runtime</SelectItem>
                          <SelectItem value="cpp">C++ (GCC)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Difficulty Level</Label>
                      <Select value={codingDifficulty} onValueChange={setCodingDifficulty}>
                        <SelectTrigger className="rounded-xl h-11 font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl font-bold">
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="border-t pt-4">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="rounded-xl px-6 font-bold"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || (newType === "MCQ" ? !mcqText.trim() : !codingPrompt.trim())}
              >
                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Challenge to Bank
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-2xl shadow-soft border-primary/10">
        <CardHeader className="border-b bg-muted/15 pb-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search repository by question keywords or topic..."
                className="rounded-xl pl-10 h-10 bg-background border-muted/80 focus:border-primary transition-all"
              />
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-48 rounded-xl h-10 font-bold bg-background"><Filter className="mr-2 h-4 w-4 text-primary" /><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl font-bold">
                <SelectItem value="all">All Question Types</SelectItem>
                <SelectItem value="MCQ">MCQ Items Only</SelectItem>
                <SelectItem value="Coding">Coding Challenges</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider">Synchronizing Repository...</span>
            </div>
          ) : isError ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p className="font-semibold">Failed to retrieve question items from repository.</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
              <div className="p-4 rounded-full bg-muted/30"><Search className="h-8 w-8 opacity-40" /></div>
              <p className="font-semibold">No questions found matching your filter Criteria.</p>
            </div>
          ) : (
            <div className="divide-y">
              {questions.map((x) => (
                <div key={x.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/15 group">
                  <div className="text-[11px] font-mono text-primary/70 w-20 truncate font-black">{x.id.substring(0, 8)}...</div>
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="text-sm font-extrabold text-foreground truncate group-hover:text-primary transition-colors">{x.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider bg-muted/40 px-2 py-0.5 rounded-md">{x.category}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-0.5 text-[10px] font-extrabold uppercase">
                    {x.type}
                  </Badge>
                  <Badge variant="outline" className={`rounded-full px-3 py-0.5 text-[10px] uppercase tracking-wide ${diffColor[x.difficulty || "medium"] || ""}`}>
                    {x.difficulty || "medium"}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" title="Edit question item" className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary">
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Remove question"
                      className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={() => {
                        if (confirm(`Permanently delete this ${x.type} question from the shared bank?`)) {
                          deleteMutation.mutate(x);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
