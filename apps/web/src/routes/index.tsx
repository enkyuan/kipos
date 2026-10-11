import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StartShadowingForm } from "#features/meetings/start-shadowing-form";
import { WorkspaceLayout } from "#features/workspace/workspace-layout";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Shadow a meeting · Ouro" }] }),
  component: Workspace,
});

function Workspace() {
  const navigate = useNavigate();
  return (
    <WorkspaceLayout>
      <StartShadowingForm
        // The session id lives in the URL: refreshing shows the same session
        // and never starts another notetaker.
        onStarted={(meetingId) => navigate({ to: "/meetings/$meetingId", params: { meetingId } })}
      />
    </WorkspaceLayout>
  );
}
