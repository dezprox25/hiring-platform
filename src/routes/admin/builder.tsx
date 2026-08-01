import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { GripVertical, Plus, Trash2, ListChecks, Code2, Keyboard, Save, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/builder")({
  head: () => ({ meta: [{ title: "Assessment Builder · Dezprox" }] }),
  component: Builder,
});

type Section = { id: string; title: string; type: "MCQ" | "Coding" | "Typing"; questions: number; duration: number };

function Builder() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("Frontend Engineer · Mid Level");
  const [role, setRole] = useState("frontend");
  const [passingScore, setPassingScore] = useState(70);
  const [antiCheat, setAntiCheat] = useState(true);

  const [sections, setSections] = useState<Section[]>([
    { id: "s1", title: "Aptitude MCQ", type: "MCQ", questions: 15, duration: 20 },
    { id: "s2", title: "Typing Speed", type: "Typing", questions: 1, duration: 5 },
    { id: "s3", title: "Coding Round", type: "Coding", questions: 2, duration: 60 },
  ]);

  const icons = { MCQ: ListChecks, Coding: Code2, Typing: Keyboard };

  const addSection = (type: "MCQ" | "Coding" | "Typing" = "MCQ", customTitle?: string) => {
    setSections((s) => [
      ...s, 
      { 
        id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, 
        title: customTitle || `${type} Section`, 
        type, 
        questions: type === "Coding" ? 2 : type === "Typing" ? 1 : 10, 
        duration: type === "Coding" ? 45 : type === "Typing" ? 5 : 15 
      }
    ]);
  };

  const removeSection = (id: string) => setSections((s) => s.filter(x => x.id !== id));

  const handleSave = (status: "Draft" | "Active") => {
    if (!title.trim()) {
      toast.error("Validation Error", { description: "Please enter a title for the assessment." });
      return;
    }
    if (sections.length === 0) {
      toast.error("Validation Error", { description: "An assessment must include at least one round." });
      return;
    }

    const newTemplate = {
      id: "AS-" + Math.floor(100 + Math.random() * 900),
      title: title.trim(),
      role,
      passingScore,
      antiCheat,
      rounds: sections.length,
      candidates: 0,
      duration: sections.reduce((a, b) => a + b.duration, 0),
      questions: sections.reduce((a, b) => a + b.questions, 0),
      status,
      createdAt: new Date().toISOString(),
      sections
    };

    const existing = JSON.parse(localStorage.getItem("dezprox_assessment_templates") || "[]");
    localStorage.setItem("dezprox_assessment_templates", JSON.stringify([newTemplate, ...existing]));

    if (status === "Active") {
      toast.success("Assessment Published Successfully", {
        description: `"${newTemplate.title}" is now active and ready for candidate invitations.`
      });
    } else {
      toast.info("Draft Saved", {
        description: `"${newTemplate.title}" has been saved as a draft.`
      });
    }
    navigate({ to: "/admin/assessments" });
  };

  return (
    <DashboardLayout role="admin" title="Assessment Builder">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Assessment Designer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure multi-round evaluations, set duration boundaries, and calibrate grading thresholds.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="rounded-xl h-11 px-5 border-primary/20 hover:bg-primary/5 font-bold"
            onClick={() => handleSave("Draft")}
          >
            <Save className="mr-2 h-4 w-4 text-primary" /> Save as Draft
          </Button>
          <Button 
            className="rounded-xl h-11 px-6 font-bold shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
            onClick={() => handleSave("Active")}
          >
            <Send className="mr-2 h-4 w-4" /> Publish Assessment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="rounded-2xl shadow-soft border-primary/10">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="text-base font-bold">Assessment Metadata</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 pt-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Assessment Title</Label>
                <Input 
                  className="rounded-xl h-11 bg-muted/30 font-medium" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Target Role / Track</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="rounded-xl h-11 bg-muted/30 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="frontend">Frontend Engineer</SelectItem>
                    <SelectItem value="backend">Backend Engineer</SelectItem>
                    <SelectItem value="fullstack">Full-Stack Engineer</SelectItem>
                    <SelectItem value="devops">DevOps / Infrastructure</SelectItem>
                    <SelectItem value="data">Data Scientist / ML</SelectItem>
                    <SelectItem value="qa">QA / Automation Engineer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Minimum Passing Score (%)</Label>
                <Input 
                  type="number" 
                  value={passingScore} 
                  onChange={(e) => setPassingScore(Number(e.target.value))} 
                  className="rounded-xl h-11 bg-muted/30 font-mono font-bold text-base" 
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border bg-muted/15 p-4">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-foreground">Proctoring & Anti-Cheat</Label>
                  <div className="text-xs text-muted-foreground">Tab-switch detection & copy lock</div>
                </div>
                <Switch checked={antiCheat} onCheckedChange={setAntiCheat} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 pb-4">
              <div>
                <CardTitle className="text-base font-bold">Assessment Rounds</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Drag or modify sequential test stages</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="rounded-xl h-9 font-bold" onClick={() => addSection("MCQ")}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> MCQ
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl h-9 font-bold" onClick={() => addSection("Coding")}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Coding
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl h-9 font-bold" onClick={() => addSection("Typing")}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Typing
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {sections.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground border-2 border-dashed rounded-2xl">
                  No rounds configured. Click buttons above to add test sections.
                </div>
              ) : (
                sections.map((s, idx) => {
                  const Icon = icons[s.type];
                  return (
                    <div key={s.id} className="group rounded-2xl border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab group-hover:text-foreground" />
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <Input 
                            value={s.title} 
                            onChange={(e) => setSections(sec => sec.map(item => item.id === s.id ? { ...item, title: e.target.value } : item))}
                            className="rounded-xl font-bold border-transparent bg-transparent hover:border-muted focus:border-primary focus:bg-background transition-all h-9 text-base px-2" 
                          />
                        </div>
                        <Badge variant="outline" className="rounded-lg px-3 py-1 text-xs uppercase font-extrabold tracking-tight border-primary/20 bg-primary/5 text-primary">
                          Round {idx + 1} · {s.type}
                        </Badge>
                        <Button size="icon" variant="ghost" title="Remove section" className="rounded-lg h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => removeSection(s.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-6 grid gap-6 rounded-xl bg-muted/20 p-4 md:grid-cols-2">
                        <div>
                          <div className="flex justify-between text-xs font-bold text-muted-foreground mb-2">
                            <span>Questions Quantity</span>
                            <span className="text-foreground font-mono font-black">{s.questions} {s.questions === 1 ? "item" : "items"}</span>
                          </div>
                          <Slider 
                            value={[s.questions]} 
                            max={30} 
                            min={1} 
                            step={1} 
                            onValueChange={([val]) => setSections(sec => sec.map(item => item.id === s.id ? { ...item, questions: val } : item))} 
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs font-bold text-muted-foreground mb-2">
                            <span>Time Allocation</span>
                            <span className="text-primary font-mono font-black">{s.duration} min</span>
                          </div>
                          <Slider 
                            value={[s.duration]} 
                            max={120} 
                            min={5} 
                            step={5} 
                            onValueChange={([val]) => setSections(sec => sec.map(item => item.id === s.id ? { ...item, duration: val } : item))} 
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl shadow-soft border-primary/10 h-fit sticky top-6">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="text-base font-bold">Specification Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-muted/30 p-3.5">
                <span className="font-semibold text-muted-foreground">Total Stages</span>
                <span className="text-base font-black text-foreground">{sections.length} rounds</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/30 p-3.5">
                <span className="font-semibold text-muted-foreground">Question Pool</span>
                <span className="text-base font-black text-foreground">{sections.reduce((a,b)=>a+b.questions,0)} items</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/30 p-3.5">
                <span className="font-semibold text-muted-foreground">Estimated Runtime</span>
                <span className="text-base font-black text-primary font-mono">{sections.reduce((a,b)=>a+b.duration,0)} mins</span>
              </div>

              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs dark:bg-amber-500/5">
                <div className="flex items-center gap-2 font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  <Sparkles className="h-4 w-4" /> AI Curriculum Recommendation
                </div>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  For mid-to-senior engineering positions, pairing a fast 15-minute conceptual MCQ round with a rigorous 45-minute practical coding problem optimizes both completion rates and predictive hiring signal.
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-3 w-full h-8 rounded-lg text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-500/20"
                  onClick={() => {
                    if (!sections.some(s => s.title.includes("System Design"))) {
                      addSection("MCQ", "System Design & Architecture");
                      toast.success("Added System Design round");
                    } else {
                      toast.info("System Design round already present");
                    }
                  }}
                >
                  + Add System Design Module
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
