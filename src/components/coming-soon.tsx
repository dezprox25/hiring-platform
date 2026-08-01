import { Link } from "@tanstack/react-router";
import { DashboardLayout, type Role } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Construction, ArrowRight } from "lucide-react";

export function ComingSoon({ role, title, body }: { role: Role; title: string; body?: string }) {
  return (
    <DashboardLayout role={role} title={title}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{body || "This section is part of the demo and ready for your team to explore."}</p>
      </div>
      <Card className="rounded-2xl shadow-soft">
        <CardContent className="flex flex-col items-center justify-center gap-4 p-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Construction className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Demo placeholder</h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-md">
              In a production build this view would surface live data. For the demo, jump back to the dashboard.
            </p>
          </div>
          <Link to="/"><Button className="rounded-xl">Back home <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
