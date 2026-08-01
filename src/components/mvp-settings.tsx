import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Bell, Shield, Palette, UserCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface MvpSettingsProps {
  role: "admin" | "hr" | "manager";
  title: string;
}

export function MvpSettings({ role, title }: MvpSettingsProps) {
  const [companyName, setCompanyName] = useState(() => localStorage.getItem("dezprox_setting_company") || "Dezprox Technologies");
  const [tagline, setTagline] = useState(() => localStorage.getItem("dezprox_setting_tagline") || "Next-generation technical talent hiring.");
  
  const [notifyApp, setNotifyApp] = useState(() => localStorage.getItem("dezprox_notify_app") !== "false");
  const [notifyComplete, setNotifyComplete] = useState(() => localStorage.getItem("dezprox_notify_complete") !== "false");
  const [notifyAi, setNotifyAi] = useState(() => localStorage.getItem("dezprox_notify_ai") !== "false");
  const [notifyDigest, setNotifyDigest] = useState(() => localStorage.getItem("dezprox_notify_digest") === "true");

  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(true);

  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("dezprox_setting_company", companyName.trim());
    localStorage.setItem("dezprox_setting_tagline", tagline.trim());
    toast.success("Workspace Branding Updated", {
      description: "Organization identity settings have been saved locally."
    });
  };

  const handleSaveNotifications = () => {
    localStorage.setItem("dezprox_notify_app", String(notifyApp));
    localStorage.setItem("dezprox_notify_complete", String(notifyComplete));
    localStorage.setItem("dezprox_notify_ai", String(notifyAi));
    localStorage.setItem("dezprox_notify_digest", String(notifyDigest));
    toast.success("Notification Preferences Saved", {
      description: "Email alert rules and frequency triggers have been updated."
    });
  };

  return (
    <DashboardLayout role={role} title={title}>
      <div className="mb-8 border-b pb-6">
        <h1 className="text-3xl font-black tracking-tight">Workspace & Account Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure standard MVP parameters, notification rules, and interface defaults for your role ({role.toUpperCase()}).
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="rounded-xl h-11 bg-muted/40 p-1">
          <TabsTrigger value="general" className="rounded-lg font-bold px-4"><Building2 className="mr-2 h-4 w-4 text-primary" /> Workspace & Branding</TabsTrigger>
          <TabsTrigger value="notify" className="rounded-lg font-bold px-4"><Bell className="mr-2 h-4 w-4 text-primary" /> Notification Rules</TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg font-bold px-4"><Shield className="mr-2 h-4 w-4 text-primary" /> Account Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="rounded-2xl shadow-soft border-primary/10 max-w-2xl">
            <CardHeader className="border-b bg-muted/15 pb-4">
              <CardTitle className="text-base font-bold">Organization Identity & Appearance</CardTitle>
              <CardDescription>Essential workspace credentials shared across assessment email invitations</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSaveBrand} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Company Name</Label>
                  <Input 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="rounded-xl h-11 font-bold bg-muted/30 text-foreground" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Organization Tagline</Label>
                  <Input 
                    value={tagline} 
                    onChange={(e) => setTagline(e.target.value)}
                    className="rounded-xl h-11 font-medium bg-muted/30" 
                  />
                </div>
                <div className="pt-2 border-t">
                  <Button type="submit" className="rounded-xl px-6 h-11 font-extrabold shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Save Workspace Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notify">
          <Card className="rounded-2xl shadow-soft border-primary/10 max-w-2xl">
            <CardHeader className="border-b bg-muted/15 pb-4">
              <CardTitle className="text-base font-bold">Email Alert & Event Triggers</CardTitle>
              <CardDescription>Select which hiring events trigger real-time notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between rounded-xl border p-4 transition-colors hover:bg-muted/10">
                <div>
                  <Label className="text-sm font-bold text-foreground cursor-pointer">New Candidate Application</Label>
                  <div className="text-xs text-muted-foreground">Trigger alert when a candidate self-registers or accepts an invite</div>
                </div>
                <Switch checked={notifyApp} onCheckedChange={setNotifyApp} />
              </div>
              <div className="flex items-center justify-between rounded-xl border p-4 transition-colors hover:bg-muted/10">
                <div>
                  <Label className="text-sm font-bold text-foreground cursor-pointer">Assessment Stage Completion</Label>
                  <div className="text-xs text-muted-foreground">Notify immediately when a participant completes all rounds</div>
                </div>
                <Switch checked={notifyComplete} onCheckedChange={setNotifyComplete} />
              </div>
              <div className="flex items-center justify-between rounded-xl border p-4 transition-colors hover:bg-muted/10">
                <div>
                  <Label className="text-sm font-bold text-foreground cursor-pointer">AI Coding Evaluation Ready</Label>
                  <div className="text-xs text-muted-foreground">Alert when automated AI code grading builds a final candidate report</div>
                </div>
                <Switch checked={notifyAi} onCheckedChange={setNotifyAi} />
              </div>
              <div className="flex items-center justify-between rounded-xl border p-4 transition-colors hover:bg-muted/10">
                <div>
                  <Label className="text-sm font-bold text-foreground cursor-pointer">Weekly Pipeline Summary Digest</Label>
                  <div className="text-xs text-muted-foreground">Receive a Friday rollup of department conversions and evaluation velocity</div>
                </div>
                <Switch checked={notifyDigest} onCheckedChange={setNotifyDigest} />
              </div>
              <div className="pt-3 border-t">
                <Button onClick={handleSaveNotifications} className="rounded-xl px-6 h-11 font-extrabold shadow-lg shadow-primary/20">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Apply Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="rounded-2xl shadow-soft border-primary/10 max-w-2xl">
            <CardHeader className="border-b bg-muted/15 pb-4">
              <CardTitle className="text-base font-bold">Security & Session Parameters</CardTitle>
              <CardDescription>Standard security defaults for hiring portal accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between rounded-xl border p-4 transition-colors hover:bg-muted/10">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-foreground">Two-Factor Authentication (2FA)</Label>
                  <div className="text-xs text-muted-foreground">Require mobile authenticator verification upon login</div>
                </div>
                <Switch checked={twoFactor} onCheckedChange={(val) => {
                  setTwoFactor(val);
                  toast.info(val ? "2FA Enabled" : "2FA Disabled", { description: "Security profile modified." });
                }} />
              </div>
              <div className="flex items-center justify-between rounded-xl border p-4 transition-colors hover:bg-muted/10">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-foreground">Inactivity Session Timeout</Label>
                  <div className="text-xs text-muted-foreground">Automatically log out accounts after 45 minutes of complete idle time</div>
                </div>
                <Switch checked={sessionTimeout} onCheckedChange={(val) => {
                  setSessionTimeout(val);
                  toast.info("Session Timeout Policy Updated");
                }} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
