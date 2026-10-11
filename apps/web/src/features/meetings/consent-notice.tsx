import { Alert, AlertDescription, AlertTitle } from "@ouro/ui/alert";

/** What the notetaker does, said before it starts and while it runs. */
export function ConsentNotice() {
  return (
    <Alert variant="info" role="note">
      <AlertTitle>Recording notice</AlertTitle>
      <AlertDescription>
        A participant named “Ouro notetaker” asks to join the meeting. Only after the host admits it
        does it listen and transcribe everyone's speech (through Vexa; the audio itself is not
        kept), until it leaves or the meeting ends. It never speaks, chats, or contacts anyone. Tell
        everyone in the meeting before you start.
      </AlertDescription>
    </Alert>
  );
}
