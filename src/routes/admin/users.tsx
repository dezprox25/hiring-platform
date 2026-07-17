import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCircle2, Plus } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users · Dezprox" }] }),
  component: Users,
});

function Users() {
  return (
    <DashboardLayout role="admin" title="Users">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Team members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            There is no staff directory API wired yet. When user provisioning is added, this list will populate from the backend.
          </p>
        </div>
        <Button className="rounded-xl" type="button" disabled>
          <Plus className="mr-1.5 h-4 w-4" /> Invite user
        </Button>
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCircle2 className="h-4 w-4 text-primary" /> Directory
          </CardTitle>
        </CardHeader>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          No team directory data available. Authenticated hiring staff continue to use their own profile from login.
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
