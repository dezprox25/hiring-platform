import { createFileRoute } from "@tanstack/react-router";
import { MvpSettings } from "@/components/mvp-settings";

export const Route = createFileRoute("/hr/settings")({
  head: () => ({ meta: [{ title: "Settings · Dezprox" }] }),
  component: () => <MvpSettings role="hr" title="Settings" />,
});
