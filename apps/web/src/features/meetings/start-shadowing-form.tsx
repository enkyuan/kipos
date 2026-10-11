import * as stylex from "@stylexjs/stylex";
import { Button } from "@ouro/ui/button";
import { Checkbox } from "@ouro/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@ouro/ui/field";
import { Form } from "@ouro/ui/form";
import { Input } from "@ouro/ui/input";
import { color, fontSize, fontWeight, lineHeight, space } from "@ouro/ui/tokens.stylex";
import { useState } from "react";
import { ConsentNotice } from "./consent-notice";
import { startShadowing, type StartOutcome } from "./start-shadowing";

const styles = stylex.create({
  consentLabel: {
    alignItems: "flex-start",
    gap: space.s2_5,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.sm,
  },
  actions: { display: "flex", justifyContent: "flex-end" },
  unavailable: { color: color.destructiveForeground, fontSize: fontSize.sm },
});

type FormState = { kind: "idle" | "submitting" } | Exclude<StartOutcome, { kind: "started" }>;

const required = (message: string) => (value: unknown) => (value ? null : message);

/**
 * The start control: a Google Meet link and the person's
 * explicit confirmation that participants agreed to be recorded. Nothing is
 * sent to the meeting until both are given.
 */
export function StartShadowingForm({ onStarted }: { onStarted: (meetingId: string) => void }) {
  const [state, setState] = useState<FormState>({ kind: "idle" });
  const [authorized, setAuthorized] = useState(false);

  async function submit({ meetingUrl }: { meetingUrl: string }) {
    setState({ kind: "submitting" });
    const outcome = await startShadowing(meetingUrl, authorized);
    // Stay "submitting" while the page changes, so a second click cannot start twice.
    if (outcome.kind === "started") onStarted(outcome.meetingId);
    else setState(outcome);
  }

  return (
    <Form<{ meetingUrl: string }>
      errors={state.kind === "invalid" ? { [state.field]: state.message } : undefined}
      onFormSubmit={submit}
    >
      <Field name="meetingUrl" validate={required("Paste the Google Meet link.")}>
        <FieldLabel>Google Meet link</FieldLabel>
        <Input
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://meet.google.com/abc-defg-hij"
        />
        <FieldError />
      </Field>
      <ConsentNotice />
      <Field name="authorized" validate={required("Confirm that everyone agreed before starting.")}>
        <FieldLabel xstyle={styles.consentLabel}>
          <Checkbox checked={authorized} onCheckedChange={setAuthorized} />
          Everyone in this meeting has agreed to be recorded and transcribed.
        </FieldLabel>
        <FieldError />
      </Field>
      <div {...stylex.props(styles.actions)}>
        <Button type="submit" loading={state.kind === "submitting"}>
          Start shadowing
        </Button>
      </div>
      {state.kind === "unavailable" && (
        <p role="alert" {...stylex.props(styles.unavailable)}>
          {state.message}
        </p>
      )}
    </Form>
  );
}
