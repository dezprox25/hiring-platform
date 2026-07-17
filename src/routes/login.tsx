import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { authApi } from "@/lib/api";
import { getHttpApiBaseUrl } from "@/lib/api-base";

/** Must match `DEV_SEED_ACCOUNTS` in `dezprox-backend` UsersService — dev-only UI. */
const DEV_LOCAL_DEMO_ACCOUNTS = [
  { roleLabel: "Admin", email: "priya@dezprox.com", password: "password123" },
  { roleLabel: "Manager", email: "karan@dezprox.com", password: "password123" },
  { roleLabel: "HR", email: "neha@dezprox.com", password: "password123" },
  { roleLabel: "Candidate", email: "aarav@dezprox.com", password: "password123" },
] as const;

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Dezprox" },
      { name: "description", content: "Sign in to Dezprox Hiring Platform." },
    ],
  }),
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const performLogin = async (trimmedEmail: string, trimmedPassword: string) => {
    if (!trimmedEmail || !trimmedPassword) {
      setError("Please enter both email and password.");
      return;
    }

    if (trimmedPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await authApi.login({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      const { accessToken, refreshToken, user } = response.data.data;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      navigate({ to: `/${user.role}` });
    } catch (err: unknown) {
      console.error("Login error details:", err);

      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as any;
        const status = axiosError.response?.status;
        const backendMessage = axiosError.response?.data?.message;

        if (status === 401) {
          if (import.meta.env.DEV && axiosError.config) {
            const base = axiosError.config.baseURL ?? "";
            const path = axiosError.config.url ?? "";
            console.info(`[dev] POST login resolved to: ${base}${path}`);
          }
          setError(
            import.meta.env.DEV
              ? "Could not sign in (401). Use the gray dev panel above: match API/proxy to Nest, run Postgres + migrations, restart Nest."
              : "Invalid credentials. Please check your email and password.",
          );
        } else if (status === 400) {
          setError(backendMessage || "Invalid input format.");
        } else {
          setError(backendMessage || "An unexpected error occurred. Please try again.");
        }
      } else {
        setError("Network error. Please check your internet connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email.trim(), password.trim());
  };

  const fillDemoAccount = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
  };

  const loginAsDemo = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    await performLogin(demoEmail.trim(), demoPassword.trim());
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="rounded-3xl border-border/60 shadow-elegant">
          <CardContent className="p-8">
            <Link to="/" className="mb-6 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-elegant">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-semibold">Dezprox</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Hiring Platform</span>
              </div>
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in with your organization credentials.</p>

            {import.meta.env.DEV && (
              <div className="mt-3 space-y-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-3 text-[11px] text-muted-foreground">
                <p className="text-[10px] text-foreground/80">
                  <span className="font-medium">Dev routing:</span> HTTP base{" "}
                  <code className="rounded bg-muted px-1">
                    {getHttpApiBaseUrl() || `${typeof window !== "undefined" ? window.location.origin : ""} (proxied)`}
                  </code>
                  {" · "}
                  <code className="rounded bg-muted px-1">VITE_DEV_API_PROXY</code>{" "}
                  <code className="rounded bg-muted px-1">
                    {import.meta.env.VITE_DEV_API_PROXY || "(vite.config default)"}
                  </code>
                </p>
                <p>
                  If login returns 401 with empty DB: from <code className="text-[10px]">dezprox-backend</code> run{" "}
                  <code className="text-[10px]">npm run seed:dev-users</code> (Postgres must be up). Match{" "}
                  <code className="text-[10px]">VITE_DEV_API_PROXY</code> to Nest <code className="text-[10px]">PORT</code> in{" "}
                  <code className="text-[10px]">.env.development</code>. Only one Nest process per port (fix{" "}
                  <code className="text-[10px]">EADDRINUSE</code> by stopping the old server).
                </p>
                <p className="font-medium text-foreground/80">Demo accounts (all use the same password)</p>
                <p className="font-mono text-[10px] text-foreground/70">password123</p>
                <div className="flex flex-wrap gap-2">
                  {DEV_LOCAL_DEMO_ACCOUNTS.map((acc) => (
                    <div key={acc.email} className="flex gap-1">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 rounded-lg px-2 text-[11px]"
                        disabled={isLoading}
                        onClick={() => fillDemoAccount(acc.email, acc.password)}
                      >
                        Fill {acc.roleLabel}
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        className="h-8 rounded-lg px-2 text-[11px]"
                        disabled={isLoading}
                        onClick={() => loginAsDemo(acc.email, acc.password)}
                      >
                        Sign in as {acc.roleLabel}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <form onSubmit={handle} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-xs text-primary hover:underline">
                    Forgot?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Checkbox id="remember" defaultChecked />
                <Label htmlFor="remember" className="font-normal text-muted-foreground">
                  Remember me for 30 days
                </Label>
              </div>

              <Button type="submit" className="w-full rounded-xl" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
