import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, BrainCircuit, Code2, Gauge, KanbanSquare, ListChecks, Sparkles,
  ShieldCheck, Users, Timer, Star, ArrowRight, CheckCircle2, BarChart3, FileText, Keyboard,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, RadarChart, PolarGrid,
  PolarAngleAxis, Radar, BarChart, Bar, CartesianGrid,
} from "recharts";

/** Static shapes for the public landing hero only (not live analytics). */
const LANDING_APPLICANT_TREND = [
  { month: "Jan", applicants: 220 },
  { month: "Feb", applicants: 280 },
  { month: "Mar", applicants: 310 },
  { month: "Apr", applicants: 260 },
  { month: "May", applicants: 360 },
  { month: "Jun", applicants: 410 },
];

const LANDING_SKILL_RADAR = [
  { skill: "Technical", A: 88, B: 72 },
  { skill: "Communication", A: 76, B: 80 },
  { skill: "Problem Solving", A: 92, B: 70 },
  { skill: "Speed", A: 70, B: 85 },
  { skill: "Accuracy", A: 84, B: 78 },
];

const LANDING_TOPIC_PERFORMANCE = [
  { topic: "JavaScript", score: 82 },
  { topic: "React", score: 78 },
  { topic: "Algorithms", score: 71 },
  { topic: "System Design", score: 64 },
  { topic: "SQL", score: 75 },
  { topic: "CSS", score: 86 },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dezprox Hiring Platform — Internal hiring, reimagined" },
      { name: "description", content: "Modern internal hiring & interview platform with MCQ, typing, coding rounds and AI-powered candidate evaluation." },
      { property: "og:title", content: "Dezprox Hiring Platform" },
      { property: "og:description", content: "Internal hiring & assessment platform with AI evaluation." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: ListChecks, title: "MCQ Assessments", desc: "Adaptive question banks with anti-cheat & timing." },
  { icon: Keyboard, title: "Typing Tests", desc: "Live WPM, accuracy and stamina tracking." },
  { icon: Code2, title: "Coding Rounds", desc: "Multi-language Monaco editor with test cases." },
  { icon: BrainCircuit, title: "AI Reports", desc: "Pentagon skill graphs & hiring confidence." },
  { icon: BarChart3, title: "Analytics", desc: "Funnels, conversion, topic performance." },
  { icon: KanbanSquare, title: "Pipeline", desc: "End-to-end candidate workflow." },
];

const workflow = [
  { step: "01", title: "Source", desc: "Import or invite candidates from your ATS." },
  { step: "02", title: "Assess", desc: "Send MCQ, typing & coding rounds in minutes." },
  { step: "03", title: "Evaluate", desc: "AI scores skills, recommends Hire / No Hire." },
  { step: "04", title: "Decide", desc: "Compare candidates side-by-side and offer." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-elegant">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-semibold">Dezprox</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Hiring Platform</span>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#workflow" className="hover:text-foreground">Workflow</a>
            <a href="#analytics" className="hover:text-foreground">Analytics</a>
            <a href="#ai" className="hover:text-foreground">AI Reports</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost" className="rounded-xl">Sign in</Button></Link>
            <Link to="/login"><Button className="rounded-xl">Open dashboard</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[500px] bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-5 rounded-full border bg-card/70 px-3 py-1 text-xs">
              <Sparkles className="mr-1.5 h-3 w-3 text-primary" /> AI-powered hiring · v2.4
            </Badge>
            <h1 className="text-balance text-5xl font-semibold tracking-tight md:text-6xl">
              Internal hiring, <span className="gradient-text">reimagined</span> for engineering teams.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
              Run MCQ, typing and coding rounds in one place. Let AI score candidates against your role rubric, and shortlist with confidence.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link to="/login"><Button size="lg" className="rounded-xl">Launch dashboard <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
              <Link to="/candidate/assessment"><Button size="lg" variant="outline" className="rounded-xl">Try assessment demo</Button></Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> SOC 2 ready</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Internal-only</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> 4 role-based dashboards</span>
            </div>
          </motion.div>

          {/* Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="relative mx-auto mt-16 max-w-6xl"
          >
            <div className="absolute -inset-x-12 -top-10 -z-10 h-72 rounded-[3rem] bg-gradient-to-r from-primary/20 via-info/20 to-primary/20 blur-3xl" />
            <Card className="overflow-hidden rounded-3xl border-border/70 shadow-elegant">
              <div className="grid grid-cols-12 gap-0 bg-card">
                <aside className="col-span-3 hidden border-r bg-sidebar/60 p-4 md:block">
                  <div className="flex items-center gap-2 px-2 pb-4">
                    <div className="h-8 w-8 rounded-lg bg-primary" />
                    <span className="text-sm font-semibold">Dezprox</span>
                  </div>
                  {["Dashboard","Candidates","Assessments","Analytics","AI Reports","Settings"].map((l,i)=>(
                    <div key={l} className={`mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${i===0?"bg-primary/10 text-primary":"text-muted-foreground"}`}>
                      <div className="h-3 w-3 rounded bg-current opacity-70" /> {l}
                    </div>
                  ))}
                </aside>
                <div className="col-span-12 md:col-span-9">
                  <div className="flex items-center gap-3 border-b px-5 py-3 text-xs text-muted-foreground">
                    <div className="h-2 w-2 rounded-full bg-success" /> All systems operational
                    <span className="ml-auto">Today · {new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 p-5">
                    {[
                      { label: "Candidates", value: "1,284", icon: Users },
                      { label: "Pass rate", value: "64%", icon: Gauge },
                      { label: "Pending reviews", value: "21", icon: Timer },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl border bg-background/40 p-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{s.label}</span><s.icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="mt-2 text-xl font-semibold">{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-3 px-5 pb-5 md:grid-cols-2">
                    <div className="rounded-xl border bg-background/40 p-4">
                      <div className="mb-2 text-xs font-medium text-muted-foreground">Applicant volume</div>
                      <div className="h-40">
                        <ResponsiveContainer>
                          <AreaChart data={LANDING_APPLICANT_TREND}>
                            <defs>
                              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Area dataKey="applicants" stroke="var(--color-primary)" fill="url(#g1)" strokeWidth={2} />
                            <XAxis dataKey="month" hide /><YAxis hide />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="rounded-xl border bg-background/40 p-4">
                      <div className="mb-2 text-xs font-medium text-muted-foreground">Skill coverage</div>
                      <div className="h-40">
                        <ResponsiveContainer>
                          <RadarChart data={LANDING_SKILL_RADAR}>
                            <PolarGrid stroke="var(--color-border)" />
                            <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
                            <Radar dataKey="A" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.35} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div className="mb-12 max-w-2xl">
          <Badge variant="secondary" className="rounded-full">Platform</Badge>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Everything you need to hire engineers.</h2>
          <p className="mt-3 text-muted-foreground">From the first MCQ to the final offer letter — Dezprox unifies your assessment, evaluation and collaboration in one calm interface.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Card className="h-full rounded-2xl border-border/60 transition-all hover:shadow-elegant hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><f.icon className="h-5 w-5" /></div>
                  <h3 className="text-base font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6">
          <div className="mb-12 max-w-2xl">
            <Badge variant="secondary" className="rounded-full">Workflow</Badge>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Source → Assess → Evaluate → Decide.</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {workflow.map((w) => (
              <Card key={w.step} className="rounded-2xl border-border/60">
                <CardContent className="p-6">
                  <span className="text-xs font-mono text-primary">{w.step}</span>
                  <h3 className="mt-2 text-lg font-semibold">{w.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{w.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics + AI Preview */}
      <section id="analytics" className="mx-auto grid max-w-7xl gap-6 px-4 py-20 md:grid-cols-2 md:px-6">
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardContent className="p-6">
            <Badge variant="secondary" className="rounded-full">Analytics</Badge>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">Topic performance</h3>
            <p className="mt-1 text-sm text-muted-foreground">See where your candidate pool excels and where it stumbles.</p>
            <div className="mt-6 h-64">
              <ResponsiveContainer>
                <BarChart data={LANDING_TOPIC_PERFORMANCE}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="topic" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                  <Bar dataKey="score" fill="var(--color-primary)" radius={[8,8,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card id="ai" className="rounded-2xl border-border/60 shadow-soft">
          <CardContent className="p-6">
            <Badge variant="secondary" className="rounded-full">AI</Badge>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">AI candidate evaluation</h3>
            <p className="mt-1 text-sm text-muted-foreground">Pentagon skill scoring across 5 dimensions with hiring confidence.</p>
            <div className="mt-6 h-64">
              <ResponsiveContainer>
                <RadarChart data={LANDING_SKILL_RADAR}>
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <Radar dataKey="A" name="Candidate" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.35} />
                  <Radar dataKey="B" name="Benchmark" stroke="var(--color-chart-2)" fill="var(--color-chart-2)" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6">
          <Card className="overflow-hidden rounded-3xl border-border/60 bg-gradient-to-br from-primary/10 via-card to-card shadow-elegant">
            <CardContent className="grid items-center gap-6 p-10 md:grid-cols-2 md:p-14">
              <div>
                <h3 className="text-3xl font-semibold tracking-tight md:text-4xl">Ready to hire smarter?</h3>
                <p className="mt-3 text-muted-foreground">Open the demo dashboard for any role — Admin, Manager, HR or Candidate — and feel the workflow.</p>
              </div>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <Link to="/login"><Button size="lg" className="rounded-xl">Open dashboard <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
                <Link to="/admin/analytics"><Button size="lg" variant="outline" className="rounded-xl">View analytics</Button></Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-xs text-muted-foreground md:flex-row md:px-6">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" /> © {new Date().getFullYear()} Dezprox · Internal hiring platform
          </div>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Security</a>
            <a href="#" className="hover:text-foreground">Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
