import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function StatCard({
  title, value, delta, icon: Icon, trend = "up", index = 0,
}: {
  title: string; value: string | number; delta?: string; icon: LucideIcon; trend?: "up" | "down"; index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
    >
      <Card className="rounded-2xl border-border/60 shadow-soft transition-all hover:shadow-elegant hover:-translate-y-0.5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold tracking-tight">{value}</div>
          {delta && (
            <div className={cn("mt-1 inline-flex items-center gap-1 text-xs font-medium",
              trend === "up" ? "text-success" : "text-destructive")}>
              {trend === "up" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {delta}
              <span className="text-muted-foreground font-normal">vs last month</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
