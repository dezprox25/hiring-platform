import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/hr/settings")({ component: () => <ComingSoon role="hr" title="Settings" /> });
