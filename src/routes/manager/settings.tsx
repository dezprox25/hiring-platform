import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/manager/settings")({ component: () => <ComingSoon role="manager" title="Settings" /> });
