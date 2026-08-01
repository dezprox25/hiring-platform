import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Mail, Phone, Calendar, Code2, Award, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

export interface CandidateItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  roleApplied: string;
  status: string;
  createdAt?: string;
  report?: {
    id: string;
    totalScore?: number;
    codingAiScore?: number;
    recommendation?: string;
    isShortlisted?: boolean;
  };
}

const STAGE_COLORS: Record<string, string> = {
  INVITED: "bg-muted text-muted-foreground",
  ACTIVE: "bg-info/15 text-info border-info/20",
  SUBMITTED: "bg-warning/15 text-warning-foreground border-warning/20",
  EVALUATED: "bg-primary/15 text-primary border-primary/20",
  HIRED: "bg-success/15 text-success border-success/20",
  REJECTED: "bg-destructive/15 text-destructive border-destructive/20",
};

export function CandidateListView({
  candidates,
  isLoading,
  role = "admin",
  emptyMessage = "No candidates match your current filters.",
}: {
  candidates: CandidateItem[];
  isLoading: boolean;
  role?: "admin" | "hr" | "manager";
  emptyMessage?: string;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground border-2 border-dashed border-border/50 rounded-2xl bg-card/20">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50 rounded-2xl border bg-card shadow-soft overflow-hidden">
      {candidates.map((c) => {
        const stageStyle = STAGE_COLORS[c.status.toUpperCase()] || "bg-muted text-muted-foreground";
        const score = c.report?.totalScore != null ? Number(c.report.totalScore).toFixed(0) : null;
        const targetUrl = role === "admin" ? `/admin/reports` : role === "manager" ? `/manager/reviews` : `/hr/interviews`;

        return (
          <div key={c.id} className="flex flex-wrap items-center gap-4 p-4 transition-colors hover:bg-muted/30 sm:flex-nowrap">
            <Avatar className="h-11 w-11 border border-border">
              <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                {c.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-foreground tracking-tight">{c.fullName}</span>
                <Badge variant="outline" className={`rounded-full px-2.5 py-0 text-[10px] uppercase font-semibold ${stageStyle}`}>
                  {c.status}
                </Badge>
                {c.report?.isShortlisted && (
                  <Badge className="rounded-full bg-primary/15 text-primary border border-primary/20 text-[10px] font-bold">
                    <Sparkles className="h-3 w-3 mr-1" /> Shortlisted
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground/80">{c.roleApplied}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3 text-muted-foreground/70" /> {c.email}
                </span>
                {c.phone && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground/70" /> {c.phone}
                    </span>
                  </>
                )}
                {c.createdAt && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground/70" /> {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              {score ? (
                <div className="text-right">
                  <div className="text-base font-black text-foreground tabular-nums">{score}%</div>
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Score</div>
                </div>
              ) : (
                <div className="text-right text-xs italic text-muted-foreground">Pending evaluation</div>
              )}

              {role === "manager" && c.report?.id ? (
                <Link to="/manager/reviews" search={{ id: c.report.id }}>
                  <Button size="sm" variant="outline" className="rounded-xl font-bold">
                    Review <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </Link>
              ) : (
                <Link to={targetUrl}>
                  <Button size="sm" variant="outline" className="rounded-xl font-bold">
                    View details <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
