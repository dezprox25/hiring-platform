import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ClipboardList, Users, Clock } from "lucide-react";

export const Route = createFileRoute("/admin/assessments")({
  head: () => ({ meta: [{ title: "Assessments · Dezprox" }] }),
  component: Assessments,
});

const list = [
  { id: "AS-001", title: "Frontend Engineer · Mid Level", rounds: 3, candidates: 42, duration: 90, status: "Active" },
  { id: "AS-002", title: "Backend Engineer · Senior", rounds: 4, candidates: 18, duration: 120, status: "Active" },
  { id: "AS-003", title: "Data Scientist Take-Home", rounds: 2, candidates: 26, duration: 180, status: "Draft" },
  { id: "AS-004", title: "DevOps · Cloud Native", rounds: 3, candidates: 12, duration: 90, status: "Active" },
  { id: "AS-005", title: "QA Automation Round", rounds: 2, candidates: 8, duration: 60, status: "Archived" },
];

function Assessments() {
  return (
    <DashboardLayout role="admin" title="Assessments">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Assessments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage and launch role-specific assessments.</p>
        </div>
        <Link to="/admin/builder"><Button className="rounded-xl"><Plus className="mr-1.5 h-4 w-4" /> Build assessment</Button></Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map((a) => (
          <Card key={a.id} className="rounded-2xl shadow-soft transition-all hover:shadow-elegant hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <div className="text-xs font-mono text-muted-foreground">{a.id}</div>
                <CardTitle className="mt-1 text-base">{a.title}</CardTitle>
              </div>
              <Badge variant="outline" className={`rounded-full ${a.status==="Active"?"border-success/40 text-success bg-success/10":a.status==="Draft"?"border-warning/40 text-warning-foreground bg-warning/10":""}`}>{a.status}</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl border bg-muted/30 p-3">
                  <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="mt-1 font-semibold">{a.rounds}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">Rounds</div>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="mt-1 font-semibold">{a.candidates}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">Candidates</div>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="mt-1 font-semibold">{a.duration}m</div>
                  <div className="text-[10px] uppercase text-muted-foreground">Duration</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="rounded-xl flex-1">View</Button>
                <Link to="/admin/builder" className="flex-1"><Button size="sm" className="rounded-xl w-full">Edit</Button></Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
