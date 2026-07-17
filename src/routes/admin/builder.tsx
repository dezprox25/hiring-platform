import { createFileRoute } from "@tanstack/react-router";
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
import { GripVertical, Plus, Trash2, ListChecks, Code2, Keyboard } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/admin/builder")({
  head: () => ({ meta: [{ title: "Assessment Builder · Dezprox" }] }),
  component: Builder,
});

type Section = { id: string; title: string; type: "MCQ" | "Coding" | "Typing"; questions: number; duration: number };

function Builder() {
  const [sections, setSections] = useState<Section[]>([
    { id: "s1", title: "Aptitude MCQ", type: "MCQ", questions: 15, duration: 20 },
    { id: "s2", title: "Typing Speed", type: "Typing", questions: 1, duration: 5 },
    { id: "s3", title: "Coding Round", type: "Coding", questions: 2, duration: 60 },
  ]);

  const icons = { MCQ: ListChecks, Coding: Code2, Typing: Keyboard };

  const add = () => setSections((s) => [...s, { id: `s${s.length+1}`, title: "New section", type: "MCQ", questions: 5, duration: 10 }]);
  const remove = (id: string) => setSections((s) => s.filter(x => x.id !== id));

  return (
    <DashboardLayout role="admin" title="Assessment Builder">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Build assessment</h1>
          <p className="mt-1 text-sm text-muted-foreground">Compose rounds, set timers, and define passing criteria.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl">Save draft</Button>
          <Button className="rounded-xl">Publish</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="rounded-2xl shadow-soft">
            <CardHeader><CardTitle>Assessment details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5"><Label>Title</Label><Input className="rounded-xl" defaultValue="Frontend Engineer · Mid Level" /></div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select defaultValue="frontend"><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="frontend">Frontend Engineer</SelectItem><SelectItem value="backend">Backend Engineer</SelectItem><SelectItem value="data">Data Scientist</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Passing score (%)</Label><Input type="number" defaultValue={70} className="rounded-xl" /></div>
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div><Label className="text-sm">Anti-cheat</Label><div className="text-xs text-muted-foreground">Tab switch & paste detection</div></div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sections</CardTitle>
              <Button size="sm" variant="outline" className="rounded-xl" onClick={add}><Plus className="mr-1 h-4 w-4" /> Add section</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {sections.map((s) => {
                const Icon = icons[s.type];
                return (
                  <div key={s.id} className="rounded-2xl border bg-card/40 p-4 transition-all hover:shadow-soft">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
                      <Input defaultValue={s.title} className="rounded-xl flex-1" />
                      <Badge variant="outline" className="rounded-full">{s.type}</Badge>
                      <Button size="icon" variant="ghost" className="rounded-lg text-destructive" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-xs">Questions: {s.questions}</Label>
                        <Slider defaultValue={[s.questions]} max={30} step={1} className="mt-2" />
                      </div>
                      <div>
                        <Label className="text-xs">Duration: {s.duration} min</Label>
                        <Slider defaultValue={[s.duration]} max={120} step={5} className="mt-2" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl shadow-soft h-fit">
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Sections</span><span className="font-semibold">{sections.length}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Total questions</span><span className="font-semibold">{sections.reduce((a,b)=>a+b.questions,0)}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Total duration</span><span className="font-semibold">{sections.reduce((a,b)=>a+b.duration,0)} min</span></div>
            <div className="rounded-xl border bg-primary/5 p-4 text-xs">
              <div className="font-medium text-primary">AI suggestion</div>
              <p className="mt-1 text-muted-foreground">Add a system design question to balance breadth for senior roles.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
