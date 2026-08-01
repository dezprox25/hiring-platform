import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowRight, Eye, EyeOff, Loader2, KeyRound, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Dezprox" },
      { name: "description", content: "Establish a new secure account password." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) setToken(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Missing or invalid reset token. Please request a new link from the forgot password page.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters in length.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Entered passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await authApi.resetPassword({ token, password });
      setIsSuccess(true);
      toast.success("Password Updated Successfully!");
      setTimeout(() => {
        navigate({ to: "/login" });
      }, 2500);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Invalid or expired recovery token. Please initiate another recovery request.";
      setError(msg);
      toast.error("Reset Failed", { description: msg });
    } finally {
      setIsLoading(false);
    }
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
            {isSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success border border-success/30 shadow-md">
                  <CheckCircle2 className="h-7 w-7 animate-pulse" />
                </div>
                <h2 className="text-2xl font-extrabold">Password Reset Verified</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your security profile has been updated with your new credentials. Redirecting you to the sign-in portal...
                </p>
                <div className="pt-3">
                  <Link to="/login">
                    <Button className="w-full rounded-xl h-11 font-extrabold">
                      Sign In Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-elegant">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="text-sm font-semibold">Dezprox Security</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Token Verification</span>
                  </div>
                </div>

                <h1 className="text-2xl font-semibold tracking-tight">Establish new password</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter and confirm your new access credential below.
                </p>

                {error && (
                  <div className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive font-medium border border-destructive/20">
                    {error}
                  </div>
                )}

                {!token && (
                  <div className="mt-4 rounded-xl bg-amber-500/15 border border-amber-500/30 p-3.5 text-xs text-amber-700 dark:text-amber-400 font-bold">
                    ⚠️ No recovery token detected in current URL parameters. You may need to click the exact link delivered to your email inbox.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-pass" className="font-bold">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-pass"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="rounded-xl h-11 font-medium pr-10 bg-muted/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-pass" className="font-bold">Confirm Password</Label>
                    <Input
                      id="confirm-pass"
                      type={showPassword ? "text" : "password"}
                      placeholder="Repeat password exact match"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="rounded-xl h-11 font-medium bg-muted/20"
                    />
                  </div>

                  <Button type="submit" className="w-full rounded-xl h-11 font-extrabold shadow-lg shadow-primary/25 mt-2 transition-all hover:scale-[1.01]" disabled={isLoading || !token}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating Security File...</> : <>Save New Password <ArrowRight className="ml-1.5 h-4 w-4" /></>}
                  </Button>

                  <div className="text-center pt-2">
                    <Link to="/login" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
                      Cancel & return to Sign In
                    </Link>
                  </div>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
