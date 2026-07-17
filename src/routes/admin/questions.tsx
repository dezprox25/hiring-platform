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
import { Plus, Search, Filter, Loader2, AlertCircle, Trash2, Edit2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { questionBankApi, unwrapData } from "@/lib/api";

export const Route = createFileRoute("/admin/questions")({
  head: () => ({ meta: [{ title: "Questions · Dezprox" }] }),
  component: Questions,
});

const diffColor: Record<string,string> = {
  easy: "bg-success/15 text-success border-success/30",
  medium: "bg-warning/15 text-warning-foreground border-warning/30",
  hard: "bg-destructive/15 text-destructive border-destructive/30",
};

function Questions() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [type, setType] = useState("MCQ"); // Default to MCQ since backend is fragmented
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetching logic
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

  // Unified list for UI
  const questions = useMemo(() => {
    let list: any[] = [];
    if (type === "MCQ" || type === "all") {
      list = [...list, ...(mcqResponse?.data?.map((x: any) => ({ ...x, type: "MCQ", title: x.questionText, category: x.topic })) || [])];
    }
    if (type === "Coding" || type === "all") {
      list = [...list, ...(codingResponse?.data?.map((x: any) => ({ ...x, type: "Coding", category: x.language })) || [])];
    }
    return list;
  }, [mcqResponse, codingResponse, type]);

  const deleteMutation = useMutation({
    mutationFn: (question: any) => 
      question.type === "MCQ" ? questionBankApi.deleteMcq(question.id) : questionBankApi.deleteCoding(question.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  const isLoading = isMcqLoading || isCodingLoading;
  const isError = isMcqError || isCodingError;

  return (
    <DashboardLayout role="admin" title="Questions">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Question bank</h1>
          <p className="mt-1 text-sm text-muted-foreground">Reusable questions across all assessments.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild><Button className="rounded-xl"><Plus className="mr-1.5 h-4 w-4" /> Add question</Button></DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>New question</DialogTitle>
              <DialogDescription>Add a question to the shared bank.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2"><Label>Title / Question Text</Label><Input className="rounded-xl" placeholder="e.g. Implement debounce" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select defaultValue="MCQ"><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MCQ">MCQ</SelectItem>
                      <SelectItem value="Coding">Coding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select defaultValue="medium"><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="easy">Easy</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="hard">Hard</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Content / Description</Label><Textarea className="rounded-xl min-h-[100px]" placeholder="Question content…" /></div>
            </div>
            <DialogFooter><Button className="rounded-xl w-full sm:w-auto">Save question</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questions…" className="rounded-xl pl-9" />
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-44 rounded-xl"><Filter className="mr-1.5 h-4 w-4" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="MCQ">MCQ</SelectItem>
                <SelectItem value="Coding">Coding</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : isError ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p>Failed to load questions</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Search className="h-8 w-8 opacity-20" />
              <p>No questions found</p>
            </div>
          ) : (
            <div className="divide-y">
              {questions.map((x) => (
                <div key={x.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30">
                  <div className="text-[10px] font-mono text-muted-foreground w-20 truncate">{x.id}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{x.title}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">{x.category}</div>
                  </div>
                  <Badge variant="outline" className="rounded-full text-[10px] h-5">{x.type}</Badge>
                  <Badge variant="outline" className={`rounded-full text-[10px] h-5 ${diffColor[x.difficulty] || ""}`}>{x.difficulty}</Badge>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg"><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => { if(confirm("Delete this question?")) deleteMutation.mutate(x); }}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
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
