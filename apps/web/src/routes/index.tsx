import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MeetingGrid } from "#features/meetings/meeting-grid";
import { WorkspaceLayout } from "#features/workspace/workspace-layout";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Meetings · Superpower" }] }),
  component: Workspace,
});

function Workspace() {
  const navigate = useNavigate();
  return (
    <WorkspaceLayout width="wide">
      <MeetingGrid
        // The session id lives in the URL: refreshing shows the same session
        // and never starts another notetaker.
        onStarted={(meetingId) => navigate({ to: "/meetings/$meetingId", params: { meetingId } })}
      />
    </WorkspaceLayout>
  );
}
