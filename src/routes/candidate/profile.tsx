import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/candidate/profile")({ component: () => <ComingSoon role="candidate" title="Profile" /> });
