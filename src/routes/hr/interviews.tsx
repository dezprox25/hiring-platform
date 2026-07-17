import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/hr/interviews")({ component: () => <ComingSoon role="hr" title="Interviews" /> });
