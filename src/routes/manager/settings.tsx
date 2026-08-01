import { createFileRoute } from "@tanstack/react-router";
import { MvpSettings } from "@/components/mvp-settings";

export const Route = createFileRoute("/manager/settings")({
  head: () => ({ meta: [{ title: "Settings · Dezprox" }] }),
  component: () => <MvpSettings role="manager" title="Settings" />,
});
