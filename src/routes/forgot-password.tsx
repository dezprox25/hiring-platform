import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, ArrowLeft, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { authApi, unwrapData } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password — Dezprox" },
      { name: "description", content: "Request password reset for your Dezprox account." },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please provide a valid registered email address.");
      return;
    }
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setIsSuccess(true);
      toast.success("Recovery instructions dispatched!");
    } catch (err: any) {
      toast.error("Failed to submit request", {
        description: err?.response?.data?.message || "Please check your network connection and retry."
      });
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
            <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign in
            </Link>

            {isSuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success border border-success/30 shadow-md">
                  <CheckCircle2 className="h-7 w-7 animate-bounce" />
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">Check your email</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If an account exists for <span className="font-bold text-foreground font-mono">{email}</span>, we have dispatched a verification link to reset your password.
                </p>
                <div className="pt-4 border-t">
                  <Link to="/login">
                    <Button className="w-full rounded-xl h-11 font-extrabold shadow-lg shadow-primary/20">
                      Return to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-elegant">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="text-sm font-semibold">Password Recovery</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Security Portal</span>
                  </div>
                </div>
                
                <h1 className="text-2xl font-semibold tracking-tight">Reset account credentials</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your registered corporate or candidate email to receive a secure recovery token.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-bold">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g. alex.rivera@dezprox.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      className="rounded-xl h-11 font-medium bg-muted/20"
                    />
                  </div>

                  <Button type="submit" className="w-full rounded-xl h-11 font-extrabold shadow-md shadow-primary/25 transition-all hover:scale-[1.01]" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transmitting...</> : "Dispatch Recovery Token"}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
