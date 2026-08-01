import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Video, UserCheck, Plus, CheckCircle, XCircle, Copy, Trash2, Search, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/hr/interviews")({
  head: () => ({ meta: [{ title: "Interviews · Dezprox" }] }),
  component: HRInterviews,
});

interface Interview {
  id: string;
  candidateName: string;
  role: string;
  interviewer: string;
  date: string;
  time: string;
  status: "Scheduled" | "Completed" | "Cancelled";
  link: string;
}

const defaultInterviews: Interview[] = [
  {
    id: "int-101",
    candidateName: "Rohan Sharma",
    role: "Senior Frontend Engineer",
    interviewer: "Priya (VP of Eng)",
    date: "2026-08-04",
    time: "14:00 EST",
    status: "Scheduled",
    link: "https://meet.google.com/dzx-hr-fe01"
  },
  {
    id: "int-102",
    candidateName: "Sarah Jenkins",
    role: "Backend Architect",
    interviewer: "Karan Lead",
    date: "2026-08-05",
    time: "11:00 EST",
    status: "Scheduled",
    link: "https://meet.google.com/dzx-hr-be02"
  },
  {
    id: "int-103",
    candidateName: "Liam O'Connor",
    role: "Data Scientist",
    interviewer: "Neha Director",
    date: "2026-08-01",
    time: "16:00 EST",
    status: "Completed",
    link: "https://meet.google.com/dzx-hr-ds03"
  }
];

function HRInterviews() {
  const [interviews, setInterviews] = useState<Interview[]>(() => {
    try {
      const saved = localStorage.getItem("dezprox_hr_interviews");
      return saved ? JSON.parse(saved) : defaultInterviews;
    } catch {
      return defaultInterviews;
    }
  });

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("Frontend Engineer");
  const [formInterviewer, setFormInterviewer] = useState("Priya (VP of Eng)");
  const [formDate, setFormDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState("14:00 EST");

  const saveToStorage = (updated: Interview[]) => {
    localStorage.setItem("dezprox_hr_interviews", JSON.stringify(updated));
    setInterviews(updated);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Candidate Name Required");
      return;
    }

    const randomCode = Math.random().toString(36).substring(2, 6) + "-" + Math.random().toString(36).substring(2, 6);
    const newInt: Interview = {
      id: `int_${Date.now()}`,
      candidateName: formName.trim(),
      role: formRole.trim(),
      interviewer: formInterviewer,
      date: formDate,
      time: formTime,
      status: "Scheduled",
      link: `https://meet.dezprox.com/${randomCode}`
    };

    saveToStorage([newInt, ...interviews]);
    toast.success("Interview Scheduled!", {
      description: `Meeting calendar invite dispatched to ${formName} and interviewer ${formInterviewer}.`
    });
    setDialogOpen(false);
    setFormName("");
  };

  const handleUpdateStatus = (id: string, newStatus: "Scheduled" | "Completed" | "Cancelled") => {
    const updated = interviews.map(i => i.id === id ? { ...i, status: newStatus } : i);
    saveToStorage(updated);
    toast.info(`Interview status updated to ${newStatus}`);
  };

  const handleDelete = (id: string) => {
    if (confirm("Remove this interview record?")) {
      const updated = interviews.filter(i => i.id !== id);
      saveToStorage(updated);
      toast.success("Interview record deleted");
    }
  };

  const filtered = interviews.filter(i => {
    const matchesSearch = i.candidateName.toLowerCase().includes(search.toLowerCase()) || 
                          i.role.toLowerCase().includes(search.toLowerCase()) || 
                          i.interviewer.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "all") return true;
    return i.status.toLowerCase() === filter.toLowerCase();
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Scheduled":
        return <Badge className="bg-primary/15 text-primary border-primary/30 font-extrabold uppercase text-[10px] px-2.5 py-0.5 shadow-xs animate-pulse">Scheduled</Badge>;
      case "Completed":
        return <Badge className="bg-success/15 text-success border-success/30 font-extrabold uppercase text-[10px] px-2.5 py-0.5">Completed</Badge>;
      default:
        return <Badge className="bg-destructive/15 text-destructive border-destructive/30 font-extrabold uppercase text-[10px] px-2.5 py-0.5">Cancelled</Badge>;
    }
  };

  return (
    <DashboardLayout role="hr" title="Interview Scheduling">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Interview Scheduling Roster</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Coordinate technical deep-dives, managerial evaluations, and video screenings across departments.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-11 px-5 font-bold shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]">
              <Plus className="mr-2 h-4 w-4" /> Schedule Interview
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-md border-primary/20">
            <DialogHeader>
              <DialogTitle className="text-xl font-black flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Book Candidate Interview
              </DialogTitle>
              <DialogDescription>Generates a dedicated video room and queues calendar notices.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Candidate Full Name</Label>
                <Input placeholder="e.g. Rohan Sharma" value={formName} onChange={e => setFormName(e.target.value)} required className="rounded-xl h-11 bg-muted/40 font-bold" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Target Role</Label>
                <Input value={formRole} onChange={e => setFormRole(e.target.value)} required className="rounded-xl h-11 bg-muted/40 font-medium" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Assigned Interviewer / Manager</Label>
                <Select value={formInterviewer} onValueChange={setFormInterviewer}>
                  <SelectTrigger className="rounded-xl h-11 bg-muted/40 font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl font-bold">
                    <SelectItem value="Priya (VP of Eng)">Priya (VP of Eng)</SelectItem>
                    <SelectItem value="Karan Lead">Karan Lead</SelectItem>
                    <SelectItem value="Neha Director">Neha Director</SelectItem>
                    <SelectItem value="Aarav HR Head">Aarav HR Head</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Date</Label>
                  <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} required className="rounded-xl h-11 bg-muted/40 font-semibold" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Time & Zone</Label>
                  <Input value={formTime} onChange={e => setFormTime(e.target.value)} placeholder="14:00 EST" required className="rounded-xl h-11 bg-muted/40 font-mono font-bold" />
                </div>
              </div>
              <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="rounded-xl px-6 font-bold shadow-md shadow-primary/20">Confirm Schedule</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-2xl shadow-soft border-primary/10">
        <CardHeader className="border-b bg-muted/15 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search interviews by candidate, position or interviewer..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl pl-10 h-10 bg-background border-muted/80 focus:border-primary transition-all"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")} className="rounded-xl font-bold">All ({interviews.length})</Button>
              <Button size="sm" variant={filter === "scheduled" ? "default" : "outline"} onClick={() => setFilter("scheduled")} className="rounded-xl font-bold">Scheduled</Button>
              <Button size="sm" variant={filter === "completed" ? "default" : "outline"} onClick={() => setFilter("completed")} className="rounded-xl font-bold">Completed</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground font-semibold">
              No interview sessions matching your filter criteria. Click Schedule Interview above to add meetings.
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((i) => (
                <div key={i.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-muted/15 group">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <Avatar className="h-12 w-12 border-2 border-primary/10 shadow-sm shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-black text-sm">
                        {i.candidateName.split(" ").map((n: any) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-foreground group-hover:text-primary transition-colors">{i.candidateName}</span>
                        {getStatusBadge(i.status)}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium mt-0.5">{i.role} · <span className="text-foreground font-semibold">Interviewer: {i.interviewer}</span></div>
                      <div className="flex items-center gap-4 mt-2 text-xs font-mono font-bold text-primary/80">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {i.date}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {i.time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      title="Copy meeting video link"
                      className="rounded-xl h-9 px-3.5 font-bold border-primary/20 bg-primary/5 hover:bg-primary/15 text-primary text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(i.link);
                        toast.success("Meeting link copied to clipboard", { description: i.link });
                      }}
                    >
                      <Video className="h-3.5 w-3.5 mr-1.5" /> Copy Meet Link
                    </Button>

                    {i.status === "Scheduled" ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          title="Mark interview as completed"
                          className="rounded-xl h-9 w-9 p-0 text-success hover:bg-success/10 border-success/30"
                          onClick={() => handleUpdateStatus(i.id, "Completed")}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          title="Cancel interview"
                          className="rounded-xl h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleUpdateStatus(i.id, "Cancelled")}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        title="Reopen / Reschedule"
                        className="rounded-xl h-9 px-3 text-xs font-semibold text-muted-foreground hover:bg-muted/30"
                        onClick={() => handleUpdateStatus(i.id, "Scheduled")}
                      >
                        Reopen
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      title="Delete meeting record"
                      className="rounded-xl h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(i.id)}
                    >
                      <Trash2 className="h-4 w-4" />
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
