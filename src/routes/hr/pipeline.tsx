import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { candidatesApi, unwrapData } from "@/lib/api";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/hr/pipeline")({
  head: () => ({ meta: [{ title: "Pipeline · Dezprox" }] }),
  component: Pipeline,
});

type BackendStatus = "INVITED" | "ACTIVE" | "SUBMITTED" | "EVALUATED" | "HIRED" | "REJECTED";

const stages: { key: BackendStatus; label: string }[] = [
  { key: "INVITED", label: "Invited" },
  { key: "ACTIVE", label: "Active" },
  { key: "SUBMITTED", label: "Submitted" },
  { key: "EVALUATED", label: "Evaluated" },
  { key: "HIRED", label: "Hired" },
  { key: "REJECTED", label: "Rejected" },
];

const stageHue: Record<BackendStatus, string> = {
  INVITED: "border-t-muted-foreground/40",
  ACTIVE: "border-t-info",
  SUBMITTED: "border-t-warning",
  EVALUATED: "border-t-primary",
  HIRED: "border-t-success",
  REJECTED: "border-t-destructive",
};

function Pipeline() {
  const { data: response, isLoading } = useQuery({
    queryKey: ["candidates", "pipeline"],
    queryFn: async () => unwrapData(await candidatesApi.findAll({ limit: 100 })),
  });

  const allCandidates = response?.data || [];

  return (
    <DashboardLayout role="hr" title="Pipeline">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Candidate pipeline</h1>
        <p className="mt-1 text-sm text-muted-foreground">Real-time status tracking for all candidates.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {stages.map((stage) => {
          const items = allCandidates.filter((c: any) => c.status === stage.key);
          return (
            <div key={stage.key} className={`flex flex-col rounded-2xl border bg-card/40 p-3 border-t-4 ${stageHue[stage.key]}`}>
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="text-[10px] font-black uppercase tracking-widest">{stage.label}</div>
                <Badge variant="secondary" className="rounded-full text-[10px] tabular-nums">{items.length}</Badge>
              </div>
              <div className="flex-1 space-y-2 min-h-32">
                {isLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                ) : (
                  items.map((c: any, i: number) => (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                      <Card className="rounded-xl shadow-soft border-border/60 hover:shadow-elegant transition-all">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7"><AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                              {c.fullName.split(" ").map((n:any)=>n[0]).join("")}
                            </AvatarFallback></Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[11px] font-bold">{c.fullName}</div>
                              <div className="truncate text-[10px] text-muted-foreground">{c.roleApplied}</div>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <Badge variant="outline" className="rounded-full text-[9px] tabular-nums">Score {c.report?.totalScore || "-"}</Badge>
                            <span className="text-[9px] text-muted-foreground">{new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
