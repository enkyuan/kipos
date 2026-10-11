import { createFileRoute } from "@tanstack/react-router";
import { AnalysisPanel } from "#features/analysis/analysis-panel";
import { MeetingView } from "#features/meetings/meeting-view";
import { WorkspaceLayout } from "#features/workspace/workspace-layout";

export const Route = createFileRoute("/meetings/$meetingId")({
  head: () => ({ meta: [{ title: "Meeting · Ouro" }] }),
  component: Meeting,
});

function Meeting() {
  const { meetingId } = Route.useParams();
  return (
    <WorkspaceLayout width="wide">
      <MeetingView meetingId={meetingId} aside={<AnalysisPanel meetingId={meetingId} />} />
    </WorkspaceLayout>
  );
}
