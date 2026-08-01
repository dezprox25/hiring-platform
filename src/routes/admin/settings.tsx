import { createFileRoute } from "@tanstack/react-router";
import { MvpSettings } from "@/components/mvp-settings";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings · Dezprox" }] }),
  component: () => <MvpSettings role="admin" title="Settings" />,
});
