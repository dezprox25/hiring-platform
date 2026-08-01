import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { User, Mail, Briefcase, Award, FileText, Upload, CheckCircle2, X, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/candidate/profile")({
  head: () => ({ meta: [{ title: "My Profile · Dezprox" }] }),
  component: CandidateProfile,
});

function CandidateProfile() {
  const [fullName, setFullName] = useState("Alex Rivera");
  const [email, setEmail] = useState("alex.rivera@example.com");
  const [phone, setPhone] = useState("+1 (555) 018-9271");
  const [roleApplied, setRoleApplied] = useState("Senior Full-Stack Engineer");
  const [experience, setExperience] = useState("5");
  const [bio, setBio] = useState("Passionate software engineer specializing in scalable TypeScript backends, React architectures, and cloud-native systems.");
  
  const [skills, setSkills] = useState<string[]>(["TypeScript", "React 19", "Node.js", "NestJS", "PostgreSQL", "Tailwind CSS", "AWS"]);
  const [newSkill, setNewSkill] = useState("");
  const [resumeName, setResumeName] = useState("Alex_Rivera_Resume_2026.pdf");
  const [lastSaved, setLastSaved] = useState("Today, 10:45 AM");

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (!skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    toast.success("Profile Preferences Saved", {
      description: "Your updated background credentials are now visible to hiring review boards."
    });
  };

  const handleSimulateUpload = () => {
    const fakeNames = ["Rivera_Alex_CV.pdf", "Senior_Engineer_Dossier_Rivera.pdf", "Alex_Rivera_Fullstack.pdf"];
    const randomName = fakeNames[Math.floor(Math.random() * fakeNames.length)];
    setResumeName(randomName);
    toast.success("Resume Uploaded Successfully", {
      description: `Linked ${randomName} to your candidate evaluation file.`
    });
  };

  return (
    <DashboardLayout role="candidate" title="Candidate Profile">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Candidate Dossier & Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your technical background, portfolio tags, and assessment contact information.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold bg-muted/40 px-4 py-2 rounded-xl border">
          <CheckCircle2 className="h-4 w-4 text-success" /> Profile last synced: {lastSaved}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="rounded-2xl shadow-soft border-primary/10">
            <CardHeader className="border-b bg-muted/15 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Personal Identifiers & Experience
              </CardTitle>
              <CardDescription>Primary credentials linked to your test sessions</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Full Name</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="rounded-xl h-11 bg-muted/30 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Registered Email</Label>
                    <Input type="email" value={email} disabled className="rounded-xl h-11 bg-muted/50 text-muted-foreground font-mono" title="Contact admin to change registered email" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Phone Number</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl h-11 bg-muted/30 font-medium" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Years of Experience</Label>
                    <Input type="number" value={experience} onChange={(e) => setExperience(e.target.value)} className="rounded-xl h-11 bg-muted/30 font-bold font-mono" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Target Role Track</Label>
                    <Input value={roleApplied} onChange={(e) => setRoleApplied(e.target.value)} className="rounded-xl h-11 bg-muted/30 font-bold text-primary" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Professional Summary & Bio</Label>
                    <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="rounded-xl min-h-[100px] bg-muted/30 leading-relaxed" />
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <Button type="submit" className="rounded-xl px-6 h-11 font-extrabold shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Save Profile Details
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft border-primary/10">
            <CardHeader className="border-b bg-muted/15 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" /> Technical Competencies & Skill Tags
              </CardTitle>
              <CardDescription>Tags matched by automated screening algorithms against role requisitions</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2 mb-6">
                {skills.map(s => (
                  <Badge key={s} variant="secondary" className="rounded-xl px-3 py-1.5 text-xs font-extrabold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5 shadow-sm">
                    {s}
                    <button type="button" onClick={() => handleRemoveSkill(s)} className="rounded-full hover:bg-primary/20 p-0.5 transition-colors">
                      <X className="h-3 w-3 text-primary/70 hover:text-destructive" />
                    </button>
                  </Badge>
                ))}
              </div>
              <form onSubmit={handleAddSkill} className="flex gap-2 max-w-sm">
                <Input 
                  placeholder="Add skill tag (e.g. Docker, GraphQL)" 
                  value={newSkill} 
                  onChange={(e) => setNewSkill(e.target.value)} 
                  className="rounded-xl h-10 bg-muted/30 font-medium" 
                />
                <Button type="submit" variant="outline" className="rounded-xl h-10 px-4 font-bold border-primary/20 hover:bg-primary/5">
                  <Plus className="h-4 w-4 mr-1" /> Add Tag
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl shadow-soft border-primary/10 overflow-hidden text-center">
            <CardContent className="p-6 pt-8 bg-gradient-to-b from-card to-muted/30">
              <Avatar className="mx-auto h-24 w-24 border-4 border-primary/20 shadow-xl">
                <AvatarFallback className="bg-primary/15 text-primary text-2xl font-black">
                  {fullName.split(" ").map((n: any)=>n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <h3 className="mt-4 text-xl font-black text-foreground">{fullName}</h3>
              <p className="text-xs font-semibold text-primary font-mono mt-0.5">{roleApplied}</p>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-success/15 border border-success/30 px-3 py-1 text-xs font-extrabold text-success">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" /> Assessment Account Verified
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft border-primary/10">
            <CardHeader className="border-b bg-muted/15 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Resume & Document Dossier
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-5 text-center transition-colors hover:bg-primary/10">
                <FileText className="mx-auto h-10 w-10 text-primary opacity-80 mb-2" />
                <div className="text-sm font-bold text-foreground truncate px-2 font-mono">{resumeName}</div>
                <div className="text-xs text-muted-foreground mt-1">PDF document · Verified scan</div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSimulateUpload}
                  className="mt-4 rounded-xl h-9 font-bold bg-background shadow-sm hover:border-primary w-full"
                >
                  <Upload className="mr-2 h-3.5 w-3.5" /> Replace Resume PDF
                </Button>
              </div>

              <div className="rounded-xl border bg-card p-4 text-xs space-y-2">
                <div className="font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Automated Parse Verified
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Your uploaded resume has been analyzed and paired with your assessment evaluations for manager inspection.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
