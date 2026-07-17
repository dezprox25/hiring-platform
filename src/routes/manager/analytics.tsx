import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/manager/analytics")({ component: () => <ComingSoon role="manager" title="Analytics" /> });
