import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Bell, Shield, Palette } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings · Dezprox" }] }),
  component: Settings,
});

function Settings() {
  return (
    <DashboardLayout role="admin" title="Settings">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Workspace, notifications, and security preferences.</p>
      </div>

      <Tabs defaultValue="brand" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="brand" className="rounded-lg"><Building2 className="mr-1.5 h-4 w-4" /> Branding</TabsTrigger>
          <TabsTrigger value="theme" className="rounded-lg"><Palette className="mr-1.5 h-4 w-4" /> Theme</TabsTrigger>
          <TabsTrigger value="notify" className="rounded-lg"><Bell className="mr-1.5 h-4 w-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg"><Shield className="mr-1.5 h-4 w-4" /> Security</TabsTrigger>
        </TabsList>

        <TabsContent value="brand">
          <Card className="rounded-2xl shadow-soft">
            <CardHeader><CardTitle>Company branding</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5"><Label>Company name</Label><Input className="rounded-xl" defaultValue="Dezprox Inc." /></div>
              <div className="space-y-1.5"><Label>Domain</Label><Input className="rounded-xl" defaultValue="dezprox.com" /></div>
              <div className="space-y-1.5 md:col-span-2"><Label>Tagline</Label><Input className="rounded-xl" defaultValue="Internal hiring, reimagined." /></div>
              <div className="md:col-span-2"><Button className="rounded-xl">Save changes</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme">
          <Card className="rounded-2xl shadow-soft">
            <CardHeader><CardTitle>Theme</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {["System default","Light","Dark"].map((t,i) => (
                <div key={t} className="flex items-center justify-between rounded-xl border p-4">
                  <div><Label className="text-sm">{t}</Label><div className="text-xs text-muted-foreground">Match your OS preference.</div></div>
                  <Switch defaultChecked={i===0} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notify">
          <Card className="rounded-2xl shadow-soft">
            <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { l: "New candidate applied", d: "Get notified when someone applies." },
                { l: "Assessment completed", d: "Email me when a candidate finishes." },
                { l: "AI report ready", d: "Notify when an AI report is generated." },
                { l: "Weekly digest", d: "Summary of pipeline activity." },
              ].map((x, i) => (
                <div key={x.l} className="flex items-center justify-between rounded-xl border p-4">
                  <div><Label className="text-sm">{x.l}</Label><div className="text-xs text-muted-foreground">{x.d}</div></div>
                  <Switch defaultChecked={i < 3} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="rounded-2xl shadow-soft">
            <CardHeader><CardTitle>Security</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { l: "Two-factor authentication", d: "Require 2FA for all team members." },
                { l: "SSO via Google Workspace", d: "Single sign-on integration." },
                { l: "Session timeout", d: "Auto sign out after 30 min idle." },
              ].map((x) => (
                <div key={x.l} className="flex items-center justify-between rounded-xl border p-4">
                  <div><Label className="text-sm">{x.l}</Label><div className="text-xs text-muted-foreground">{x.d}</div></div>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
