import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Download, Filter, Sparkles, FileText, Mail, Loader2, AlertCircle, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { candidatesApi, unwrapData } from "@/lib/api";
import { downloadCsv } from "@/lib/export-csv";
import { toast } from "sonner";

export const Route = createFileRoute("/hr/candidates")({
  head: () => ({ meta: [{ title: "Candidates · Dezprox" }] }),
  component: CandidatesPage,
});

const stageColor: Record<string, string> = {
  INVITED: "bg-muted text-muted-foreground",
  ACTIVE: "bg-info/15 text-info border-info/20",
  SUBMITTED: "bg-warning/15 text-warning-foreground border-warning/20",
  EVALUATED: "bg-primary/15 text-primary border-primary/20",
  HIRED: "bg-success/15 text-success border-success/20",
  REJECTED: "bg-destructive/15 text-destructive border-destructive/20",
};

const recColor: Record<string, string> = {
  "Strong Hire": "bg-success/15 text-success border-success/30 font-bold",
  Hire: "bg-primary/15 text-primary border-primary/30 font-semibold",
  Maybe: "bg-warning/15 text-warning-foreground border-warning/30 font-semibold",
  "No Hire": "bg-destructive/15 text-destructive border-destructive/30",
};

function CandidatesPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    roleApplied: "",
    notes: "",
  });

  const { data: response, isLoading, isError, error } = useQuery({
    queryKey: ["candidates-hr", { q, stage, page }],
    queryFn: () =>
      candidatesApi
        .findAll({
          search: q || undefined,
          status: stage === "all" ? undefined : stage,
          page,
          limit,
        })
        .then((res) => unwrapData(res)),
  });

  const candidates = response?.data || [];
  const total = response?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        fullName: inviteForm.fullName.trim(),
        email: inviteForm.email.trim().toLowerCase(),
        roleApplied: inviteForm.roleApplied.trim(),
        phone: inviteForm.phone.trim() || undefined,
        notes: inviteForm.notes.trim() || undefined,
      };
      return unwrapData(await candidatesApi.create(payload));
    },
    onSuccess: () => {
      toast.success("Candidate invited successfully", {
        description: "An assessment invitation account has been created for the candidate.",
      });
      setInviteOpen(false);
      setInviteForm({ fullName: "", email: "", phone: "", roleApplied: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: ["candidates-hr"] });
    },
    onError: (err: any) => {
      toast.error("Could not invite candidate", { description: err.response?.data?.message || "Please check details and try again." });
    },
  });

  const handleExport = () => {
    if (!candidates.length) {
      toast.warning("Nothing to export", { description: "Load candidates first or widen your filter selection." });
      return;
    }
    downloadCsv(
      `hr-candidates-export-${new Date().toISOString().split("T")[0]}.csv`,
      ["Full Name", "Email", "Role", "Status", "Score", "Applied Date"],
      candidates.map((c: any) => [
        c.fullName,
        c.user?.email ?? "",
        c.roleApplied,
        c.status,
        c.assessment?.score != null ? String(c.assessment.score) : "Pending",
        new Date(c.createdAt).toLocaleDateString(),
      ]),
    );
    toast.success("Export completed", { description: `Exported ${candidates.length} candidate record(s) to CSV.` });
  };

  return (
    <DashboardLayout role="hr" title="Candidates Pipeline">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Candidate Roster</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? "Synchronizing pipeline data..." : `Managing total talent pool of ${total} candidates`}
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="rounded-xl h-11 px-5 font-bold border-primary/20 hover:bg-primary/5"
            onClick={handleExport}
            disabled={isLoading || !candidates.length}
          >
            <Download className="mr-2 h-4 w-4 text-primary" /> Export CSV
          </Button>

          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl h-11 px-6 font-bold shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]">
                <Plus className="mr-2 h-4 w-4" /> Invite Candidate
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-md border-primary/20">
              <DialogHeader>
                <DialogTitle className="text-xl font-black">Invite Candidate to Pipeline</DialogTitle>
                <DialogDescription>
                  Creates an assessment login credential and assigns a testing track to the candidate.
                </DialogDescription>
              </DialogHeader>
              <form
                className="space-y-4 py-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!inviteForm.fullName.trim() || !inviteForm.email.trim() || !inviteForm.roleApplied.trim()) {
                    toast.error("Validation Error", { description: "Full name, email, and role applied are required fields." });
                    return;
                  }
                  inviteMutation.mutate();
                }}
              >
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Full Name</Label>
                  <Input
                    placeholder="e.g. Maya Lin"
                    value={inviteForm.fullName}
                    onChange={(e) => setInviteForm((f) => ({ ...f, fullName: e.target.value }))}
                    className="rounded-xl h-11 bg-muted/40 font-medium"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Email Address</Label>
                  <Input
                    type="email"
                    placeholder="maya.lin@example.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                    className="rounded-xl h-11 bg-muted/40 font-medium"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Target Role / Position</Label>
                  <Input
                    placeholder="e.g. Frontend Engineer · Senior"
                    value={inviteForm.roleApplied}
                    onChange={(e) => setInviteForm((f) => ({ ...f, roleApplied: e.target.value }))}
                    className="rounded-xl h-11 bg-muted/40 font-medium"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Phone Number (Optional)</Label>
                  <Input
                    placeholder="+1 (555) 019-2831"
                    value={inviteForm.phone}
                    onChange={(e) => setInviteForm((f) => ({ ...f, phone: e.target.value }))}
                    className="rounded-xl h-11 bg-muted/40 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Internal HR Notes</Label>
                  <Input
                    placeholder="Referral source, expected salary, start date..."
                    value={inviteForm.notes}
                    onChange={(e) => setInviteForm((f) => ({ ...f, notes: e.target.value }))}
                    className="rounded-xl h-11 bg-muted/40 font-medium"
                  />
                </div>
                <DialogFooter className="pt-4 gap-2 sm:gap-0">
                  <Button type="button" variant="outline" className="rounded-xl" onClick={() => setInviteOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-xl px-6 font-bold" disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Provisioning…
                      </>
                    ) : (
                      "Dispatch Invitation"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="rounded-2xl shadow-soft border-primary/10">
        <CardHeader className="border-b bg-muted/15 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                value={q} 
                onChange={(e) => { setQ(e.target.value); setPage(1); }} 
                placeholder="Search candidates by name, email or applied position…" 
                className="rounded-xl pl-10 h-10 bg-background border-muted/80 focus:border-primary transition-all" 
              />
            </div>
            <Select value={stage} onValueChange={(val) => { setStage(val); setPage(1); }}>
              <SelectTrigger className="w-52 rounded-xl h-10 bg-background font-semibold"><Filter className="mr-2 h-4 w-4 text-primary" /><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Hiring Stages</SelectItem>
                <SelectItem value="INVITED">Invited / Pending</SelectItem>
                <SelectItem value="ACTIVE">Assessment Active</SelectItem>
                <SelectItem value="SUBMITTED">Submitted / In Review</SelectItem>
                <SelectItem value="EVALUATED">Evaluated</SelectItem>
                <SelectItem value="HIRED">Hired</SelectItem>
                <SelectItem value="REJECTED">Archived / Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-9 w-9 animate-spin text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider">Loading Candidate Data...</span>
              </div>
            ) : isError ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-destructive">
                <AlertCircle className="h-8 w-8" />
                <p className="font-semibold">Failed to load candidate directory. {(error as any)?.message}</p>
              </div>
            ) : candidates.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
                <div className="p-4 rounded-full bg-muted/30"><Search className="h-8 w-8 opacity-40" /></div>
                <p className="font-semibold">No candidate records found matching your specified filter query.</p>
                {q || stage !== "all" ? (
                  <Button size="sm" variant="link" onClick={() => { setQ(""); setStage("all"); }}>Reset Filter Criteria</Button>
                ) : null}
              </div>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead className="text-[11px] uppercase font-black tracking-wider text-muted-foreground bg-muted/25 border-b">
                    <tr>
                      <th className="px-6 py-3.5 text-left">Candidate Profile</th>
                      <th className="px-4 py-3.5 text-left">Target Position</th>
                      <th className="px-4 py-3.5 text-left">Current Stage</th>
                      <th className="px-4 py-3.5 text-left">Score</th>
                      <th className="px-4 py-3.5 text-left">AI Verdict</th>
                      <th className="px-4 py-3.5 text-left">Applied On</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {candidates.map((c: any) => (
                      <tr key={c.id} className="hover:bg-muted/15 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3.5">
                            <Avatar className="h-10 w-10 border shadow-sm">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-black">
                                {c.fullName.split(" ").map((n: any)=>n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-extrabold text-foreground group-hover:text-primary transition-colors">{c.fullName}</div>
                              <div className="text-xs text-muted-foreground font-mono">{c.user?.email || "No credential linked"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-bold text-foreground">{c.roleApplied}</div>
                          <div className="text-xs text-muted-foreground">{c.department || "Engineering Track"}</div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="outline" className={`rounded-full px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-tight shadow-sm ${stageColor[c.status] || "bg-muted text-muted-foreground"}`}>
                            {c.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-black text-base tabular-nums text-foreground">
                            {c.assessment?.score ?? <span className="text-muted-foreground text-xs font-normal">N/A</span>}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {c.aiRecommendation ? (
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] shadow-sm ${recColor[c.aiRecommendation] || "bg-secondary"}`}>
                              <Sparkles className="mr-1 h-3 w-3 shrink-0" />
                              {c.aiRecommendation}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground font-mono">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground text-xs font-semibold">
                          {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button size="sm" variant="outline" className="rounded-xl h-8 px-4 font-bold border-primary/20 hover:bg-primary/10 hover:text-primary">
                                Inspect
                              </Button>
                            </SheetTrigger>
                            <SheetContent className="w-full sm:max-w-xl overflow-y-auto border-l border-primary/10 p-6">
                              <SheetHeader className="border-b pb-4">
                                <SheetTitle className="text-2xl font-black">{c.fullName}</SheetTitle>
                                <SheetDescription className="text-sm font-medium">{c.roleApplied} · {c.department || "Engineering"} · {c.experience || 0}y recorded experience</SheetDescription>
                              </SheetHeader>
                              <div className="mt-6 space-y-6">
                                <Card className="rounded-2xl shadow-soft border-primary/10 overflow-hidden">
                                  <CardContent className="p-6 bg-gradient-to-br from-card to-muted/20">
                                    <div className="flex items-center gap-4">
                                      <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-md">
                                        <AvatarFallback className="bg-primary/15 text-primary font-black text-lg">
                                          {c.fullName.split(" ").map((n: any)=>n[0]).join("")}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-lg font-black truncate">{c.fullName}</div>
                                        <div className="text-xs text-muted-foreground font-mono truncate">{c.user?.email}</div>
                                        {c.phone && <div className="text-xs text-muted-foreground font-mono mt-0.5">{c.phone}</div>}
                                      </div>
                                      <div className="text-right bg-primary/5 p-3 rounded-xl border border-primary/10">
                                        <div className="text-3xl font-black text-primary tabular-nums">{c.assessment?.score ?? "—"}</div>
                                        <div className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mt-0.5">Test Rating</div>
                                      </div>
                                    </div>
                                    <div className="mt-5 flex flex-wrap gap-2 pt-4 border-t border-dashed">
                                      <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-bold">{c.status}</Badge>
                                      {c.aiRecommendation && (
                                        <Badge className={`rounded-full px-3 py-1 text-xs ${recColor[c.aiRecommendation]}`} variant="outline">
                                          <Sparkles className="mr-1 h-3.5 w-3.5" /> {c.aiRecommendation}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="mt-5 flex gap-3">
                                      <Button 
                                        size="sm" 
                                        className="rounded-xl flex-1 font-bold h-10 shadow-md shadow-primary/20"
                                        onClick={() => {
                                          if (c.user?.email) window.open(`mailto:${c.user.email}?subject=Dezprox Assessment Update regarding ${c.roleApplied}`);
                                          else toast.error("No registered email for this candidate");
                                        }}
                                      >
                                        <Mail className="mr-2 h-4 w-4" /> Send Email
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="rounded-xl flex-1 font-bold h-10 border-primary/20"
                                        onClick={() => toast.info("Resume Dossier", { description: "No uploaded PDF dossier attached in current sample environment." })}
                                      >
                                        <FileText className="mr-2 h-4 w-4 text-primary" /> View Resume
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>

                                <Card className="rounded-2xl shadow-soft border-primary/10">
                                  <CardHeader className="border-b bg-muted/20 py-3">
                                    <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">Competency & Radar Matrix</CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-5">
                                    <div className="h-60 mt-2">
                                      {c.skills && c.skills.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                          <RadarChart data={c.skills}>
                                            <PolarGrid stroke="var(--color-border)" />
                                            <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-foreground)", fontWeight: 700 }} />
                                            <Radar dataKey="value" stroke="var(--color-primary)" strokeWidth={2} fill="var(--color-primary)" fillOpacity={0.35} />
                                          </RadarChart>
                                        </ResponsiveContainer>
                                      ) : (
                                        <div className="flex h-full flex-col items-center justify-center text-xs text-muted-foreground border-2 border-dashed rounded-xl">
                                          <Sparkles className="h-6 w-6 opacity-30 mb-1" />
                                          <span className="font-semibold">Competency matrix pending assessment evaluation</span>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>

                                <Card className="rounded-2xl shadow-soft border-primary/10">
                                  <CardHeader className="border-b bg-muted/20 py-3">
                                    <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">Internal HR Evaluation Notes</CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-5">
                                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                                      "{c.notes || "No interview or screening notes recorded for this candidate profile yet."}"
                                    </p>
                                  </CardContent>
                                </Card>
                              </div>
                            </SheetContent>
                          </Sheet>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-between border-t px-6 py-4 bg-muted/10">
                  <div className="text-xs font-bold text-muted-foreground">
                    Showing Page <span className="text-foreground">{page}</span> of <span className="text-foreground">{totalPages}</span> ({total} entries)
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={page === 1} 
                      onClick={() => setPage(p => p - 1)}
                      className="rounded-xl h-9 w-9 p-0 font-bold"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={page >= totalPages} 
                      onClick={() => setPage(p => p + 1)}
                      className="rounded-xl h-9 w-9 p-0 font-bold"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
