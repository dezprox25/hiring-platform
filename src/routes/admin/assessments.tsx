import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ClipboardList, Users, Clock, Trash2, CheckCircle2, FileEdit } from "lucide-react";
import { candidatesApi, unwrapData } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/assessments")({
  head: () => ({ meta: [{ title: "Assessments · Dezprox" }] }),
  component: Assessments,
});

const defaultList = [
  { id: "AS-001", title: "Frontend Engineer · Mid Level", role: "frontend", rounds: 3, candidates: 0, duration: 90, status: "Active" },
  { id: "AS-002", title: "Backend Engineer · Senior", role: "backend", rounds: 4, candidates: 0, duration: 120, status: "Active" },
  { id: "AS-003", title: "Data Scientist Take-Home", role: "data", rounds: 2, candidates: 0, duration: 180, status: "Draft" },
  { id: "AS-004", title: "DevOps · Cloud Native", role: "devops", rounds: 3, candidates: 0, duration: 90, status: "Active" },
  { id: "AS-005", title: "QA Automation Round", role: "qa", rounds: 2, candidates: 0, duration: 60, status: "Archived" },
];

function Assessments() {
  const [filter, setFilter] = useState<string>("all");
  const [customTemplates, setCustomTemplates] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("dezprox_assessment_templates") || "[]");
    } catch {
      return [];
    }
  });

  const { data: candidates } = useQuery({
    queryKey: ["admin-candidates-for-assessments"],
    queryFn: async () => unwrapData(await candidatesApi.findAll()),
  });

  const mergedList = useMemo(() => {
    const all = [...customTemplates, ...defaultList];
    return all.map(t => {
      // Count real candidates matching this role or general assessment
      const realCount = (candidates || []).filter((c: any) => 
        c.roleApplied && (c.roleApplied.toLowerCase().includes(t.role || t.title.split(' ')[0].toLowerCase()))
      ).length;
      return {
        ...t,
        candidates: Math.max(t.candidates || 0, realCount)
      };
    }).filter(item => {
      if (filter === "active") return item.status === "Active";
      if (filter === "draft") return item.status === "Draft";
      return true;
    });
  }, [customTemplates, candidates, filter]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm("Delete this assessment template?")) {
      const updated = customTemplates.filter(x => x.id !== id);
      localStorage.setItem("dezprox_assessment_templates", JSON.stringify(updated));
      setCustomTemplates(updated);
      toast.success("Template removed from registry");
    }
  };

  const handleToggleStatus = (id: string) => {
    const updated = customTemplates.map(x => {
      if (x.id === id) {
        const next = x.status === "Active" ? "Draft" : "Active";
        toast.success(`Updated status to ${next}`);
        return { ...x, status: next };
      }
      return x;
    });
    localStorage.setItem("dezprox_assessment_templates", JSON.stringify(updated));
    setCustomTemplates(updated);
  };

  return (
    <DashboardLayout role="admin" title="Assessments">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Assessment Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Deploy automated talent screening pipelines and monitor participant engagement across open job tracks.
          </p>
        </div>
        <Link to="/admin/builder">
          <Button className="rounded-xl h-11 px-5 font-bold shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]">
            <Plus className="mr-2 h-4 w-4" /> Design New Assessment
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex gap-2">
        <Button 
          size="sm" 
          variant={filter === "all" ? "default" : "outline"} 
          onClick={() => setFilter("all")}
          className="rounded-xl font-bold px-4"
        >
          All Templates ({customTemplates.length + defaultList.length})
        </Button>
        <Button 
          size="sm" 
          variant={filter === "active" ? "default" : "outline"} 
          onClick={() => setFilter("active")}
          className="rounded-xl font-bold px-4"
        >
          Active
        </Button>
        <Button 
          size="sm" 
          variant={filter === "draft" ? "default" : "outline"} 
          onClick={() => setFilter("draft")}
          className="rounded-xl font-bold px-4"
        >
          Drafts
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mergedList.map((a) => {
          const isCustom = customTemplates.some(x => x.id === a.id);
          return (
            <Card key={a.id} className="group rounded-2xl shadow-soft transition-all duration-200 hover:shadow-elegant hover:-translate-y-1 border-primary/10 flex flex-col justify-between">
              <div>
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-primary">{a.id}</span>
                      {isCustom && <Badge variant="secondary" className="text-[9px] px-2 py-0 h-4 uppercase tracking-tighter">Custom</Badge>}
                    </div>
                    <CardTitle className="text-lg font-extrabold leading-snug">{a.title}</CardTitle>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                      a.status === "Active"
                        ? "border-success/40 text-success bg-success/15 shadow-sm"
                        : a.status === "Draft"
                        ? "border-warning/40 text-warning-foreground bg-warning/15"
                        : "border-muted text-muted-foreground"
                    }`}
                  >
                    {a.status}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-xl border border-primary/5 bg-muted/20 p-3 text-center transition-colors group-hover:bg-primary/5">
                      <ClipboardList className="mx-auto h-4 w-4 text-primary" />
                      <div className="mt-1.5 font-black text-foreground text-base">{a.rounds}</div>
                      <div className="text-[10px] font-extrabold uppercase tracking-tight text-muted-foreground">Rounds</div>
                    </div>
                    <div className="rounded-xl border border-primary/5 bg-muted/20 p-3 text-center transition-colors group-hover:bg-primary/5">
                      <Users className="mx-auto h-4 w-4 text-primary" />
                      <div className="mt-1.5 font-black text-foreground text-base">{a.candidates}</div>
                      <div className="text-[10px] font-extrabold uppercase tracking-tight text-muted-foreground">Candidates</div>
                    </div>
                    <div className="rounded-xl border border-primary/5 bg-muted/20 p-3 text-center transition-colors group-hover:bg-primary/5">
                      <Clock className="mx-auto h-4 w-4 text-primary" />
                      <div className="mt-1.5 font-black text-primary font-mono text-base">{a.duration}m</div>
                      <div className="text-[10px] font-extrabold uppercase tracking-tight text-muted-foreground">Runtime</div>
                    </div>
                  </div>
                </CardContent>
              </div>

              <div className="p-6 pt-0 mt-2">
                <div className="flex items-center gap-2 border-t pt-4">
                  <Link to="/admin/builder" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full rounded-xl h-9.5 font-bold text-xs hover:bg-primary/10 hover:text-primary">
                      <FileEdit className="mr-1.5 h-3.5 w-3.5" /> Configure / Edit
                    </Button>
                  </Link>
                  {isCustom ? (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        title={a.status === "Active" ? "Set to Draft" : "Publish"} 
                        className="rounded-xl h-9.5 w-9.5 p-0 hover:bg-success/10 hover:text-success"
                        onClick={() => handleToggleStatus(a.id)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        title="Delete template" 
                        className="rounded-xl h-9.5 w-9.5 p-0 hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => handleDelete(a.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => toast.info("Default template", { description: "Built-in assessment templates cannot be removed." })}
                      className="rounded-xl h-9.5 px-3 text-xs font-semibold text-muted-foreground"
                    >
                      Built-in
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
