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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Download,
  Filter,
  Sparkles,
  FileText,
  Mail,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { candidatesApi, unwrapData } from "@/lib/api";
import { downloadCsv } from "@/lib/export-csv";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/candidates")({
  head: () => ({ meta: [{ title: "Candidates · Dezprox" }] }),
  component: CandidatesPage,
});

const stageColor: Record<string, string> = {
  INVITED: "bg-muted text-muted-foreground",
  ACTIVE: "bg-info/15 text-info",
  SUBMITTED: "bg-warning/15 text-warning-foreground",
  EVALUATED: "bg-primary/15 text-primary",
  HIRED: "bg-success/15 text-success",
  REJECTED: "bg-destructive/15 text-destructive",
};

const recColor: Record<string, string> = {
  "Strong Hire": "bg-success/15 text-success border-success/30",
  Hire: "bg-primary/15 text-primary border-primary/30",
  Maybe: "bg-warning/15 text-warning-foreground border-warning/30",
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
    queryKey: ["candidates", { q, stage, page }],
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
      toast.success("Candidate invited", {
        description: "Account created and invite email queued (if mail is configured).",
      });
      setInviteOpen(false);
      setInviteForm({ fullName: "", email: "", phone: "", roleApplied: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error("Could not invite candidate", { description: message || "Please try again." });
    },
  });

  const handleExport = () => {
    if (!candidates.length) {
      toast.message("Nothing to export", { description: "Load candidates first or widen your filters." });
      return;
    }
    downloadCsv(
      `candidates-page-${page}.csv`,
      ["Full name", "Email", "Role", "Status", "Score", "Created"],
      candidates.map((c: {
        fullName: string;
        user?: { email?: string };
        roleApplied: string;
        status: string;
        assessment?: { score?: number };
        createdAt: string;
      }) => [
        c.fullName,
        c.user?.email ?? "",
        c.roleApplied,
        c.status,
        c.assessment?.score != null ? String(c.assessment.score) : "",
        new Date(c.createdAt).toISOString(),
      ]),
    );
    toast.success("Export started", { description: `${candidates.length} row(s) from this page.` });
  };

  return (
    <DashboardLayout role="admin" title="Candidates">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Candidates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `${total} candidates found`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={handleExport}
            disabled={isLoading || !candidates.length}
          >
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button type="button" className="rounded-xl">
                + Invite candidate
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite candidate</DialogTitle>
                <DialogDescription>
                  Creates a user account and sends login details when SMTP is configured.
                </DialogDescription>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!inviteForm.fullName.trim() || !inviteForm.email.trim() || !inviteForm.roleApplied.trim()) {
                    toast.error("Full name, email, and role are required.");
                    return;
                  }
                  inviteMutation.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="invite-name">Full name</Label>
                  <Input
                    id="invite-name"
                    value={inviteForm.fullName}
                    onChange={(e) => setInviteForm((f) => ({ ...f, fullName: e.target.value }))}
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">Role applied</Label>
                  <Input
                    id="invite-role"
                    placeholder="e.g. Frontend Engineer"
                    value={inviteForm.roleApplied}
                    onChange={(e) => setInviteForm((f) => ({ ...f, roleApplied: e.target.value }))}
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-phone">Phone (optional)</Label>
                  <Input
                    id="invite-phone"
                    value={inviteForm.phone}
                    onChange={(e) => setInviteForm((f) => ({ ...f, phone: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button type="button" variant="outline" className="rounded-xl" onClick={() => setInviteOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-xl" disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
                      </>
                    ) : (
                      "Send invite"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                value={q} 
                onChange={(e) => { setQ(e.target.value); setPage(1); }} 
                placeholder="Search by name or role…" 
                className="rounded-xl pl-9" 
              />
            </div>
            <Select value={stage} onValueChange={(val) => { setStage(val); setPage(1); }}>
              <SelectTrigger className="w-44 rounded-xl"><Filter className="mr-1.5 h-4 w-4" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                <SelectItem value="INVITED">Invited</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="EVALUATED">Evaluated</SelectItem>
                <SelectItem value="HIRED">Hired</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-destructive">
                <AlertCircle className="h-8 w-8" />
                <p>Failed to load candidates. {(error as any)?.message}</p>
              </div>
            ) : candidates.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
                <Search className="h-8 w-8 opacity-20" />
                <p>No candidates found matching your filters.</p>
              </div>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                    <tr className="border-y bg-muted/40">
                      <th className="px-6 py-3 text-left font-medium">Candidate</th>
                      <th className="px-3 py-3 text-left font-medium">Role</th>
                      <th className="px-3 py-3 text-left font-medium">Stage</th>
                      <th className="px-3 py-3 text-left font-medium">Score</th>
                      <th className="px-3 py-3 text-left font-medium">AI</th>
                      <th className="px-3 py-3 text-left font-medium">Applied</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {candidates.map((c: any) => (
                      <tr key={c.id} className="hover:bg-muted/30">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                {c.fullName.split(" ").map((n: any)=>n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{c.fullName}</div>
                              <div className="text-xs text-muted-foreground">{c.user?.email || "No email"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3"><div>{c.roleApplied}</div><div className="text-xs text-muted-foreground">{c.department || "N/A"}</div></td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${stageColor[c.status] || "bg-muted"}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-3 py-3"><span className="font-semibold tabular-nums">{c.assessment?.score ?? "-"}</span></td>
                        <td className="px-3 py-3">
                          {c.aiRecommendation ? (
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${recColor[c.aiRecommendation]}`}>
                              {c.aiRecommendation}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-3 text-right">
                          <Sheet>
                            <SheetTrigger asChild><Button size="sm" variant="ghost" className="rounded-lg">View</Button></SheetTrigger>
                            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                              <SheetHeader>
                                <SheetTitle>{c.fullName}</SheetTitle>
                                <SheetDescription>{c.roleApplied} · {c.department || "N/A"} · {c.experience || 0}y experience</SheetDescription>
                              </SheetHeader>
                              <div className="mt-6 grid gap-4">
                                <Card className="rounded-2xl"><CardContent className="p-5">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-14 w-14">
                                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                        {c.fullName.split(" ").map((n: any)=>n[0]).join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="text-lg font-semibold">{c.fullName}</div>
                                      <div className="text-xs text-muted-foreground">{c.user?.email}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-2xl font-semibold">{c.assessment?.score ?? "-"}</div>
                                      <div className="text-[10px] uppercase text-muted-foreground">overall</div>
                                    </div>
                                  </div>
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    <Badge variant="outline" className="rounded-full">{c.status}</Badge>
                                    {c.aiRecommendation && (
                                      <Badge className={`rounded-full ${recColor[c.aiRecommendation]}`} variant="outline">
                                        <Sparkles className="mr-1 h-3 w-3" /> {c.aiRecommendation}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="mt-2 flex gap-2">
                                    <Button size="sm" className="rounded-xl"><Mail className="mr-1.5 h-3.5 w-3.5" /> Message</Button>
                                    <Button size="sm" variant="outline" className="rounded-xl"><FileText className="mr-1.5 h-3.5 w-3.5" /> Resume</Button>
                                  </div>
                                </CardContent></Card>

                                <Card className="rounded-2xl"><CardContent className="p-5">
                                  <div className="text-sm font-semibold">Skill profile</div>
                                  <div className="h-56 mt-2">
                                    {c.skills ? (
                                      <ResponsiveContainer>
                                        <RadarChart data={c.skills}>
                                          <PolarGrid stroke="var(--color-border)" />
                                          <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
                                          <Radar dataKey="value" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.4} />
                                        </RadarChart>
                                      </ResponsiveContainer>
                                    ) : (
                                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                        No skill data available
                                      </div>
                                    )}
                                  </div>
                                </CardContent></Card>

                                <Card className="rounded-2xl"><CardContent className="p-5">
                                  <div className="text-sm font-semibold">Notes</div>
                                  <p className="mt-2 text-sm text-muted-foreground">{c.notes || "No internal notes for this candidate."}</p>
                                </CardContent></Card>
                              </div>
                            </SheetContent>
                          </Sheet>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-between border-t px-6 py-4">
                  <div className="text-xs text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={page === 1} 
                      onClick={() => setPage(p => p - 1)}
                      className="rounded-lg h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={page >= totalPages} 
                      onClick={() => setPage(p => p + 1)}
                      className="rounded-lg h-8 w-8 p-0"
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
