import * as stylex from "@stylexjs/stylex";
import { Button } from "@ouro/ui/button";
import { Field, FieldError, FieldLabel } from "@ouro/ui/field";
import { Form } from "@ouro/ui/form";
import { Input } from "@ouro/ui/input";
import { color, fontSize, media, space } from "@ouro/ui/tokens.stylex";
import { useState } from "react";
import { joinWaitlist, type JoinOutcome } from "./join-waitlist";

const styles = stylex.create({
  form: { maxWidth: "28rem" },
  row: {
    display: "flex",
    flexDirection: { default: "column", [media.sm]: "row" },
    alignItems: { default: "stretch", [media.sm]: "flex-start" },
    gap: space.s2,
    width: "100%",
  },
  field: { flexGrow: 1 },
  // The label stays for screen readers; the placeholder and button say it visibly.
  hiddenLabel: {
    position: "absolute",
    width: "1px",
    height: "1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
  },
  joined: { color: color.successForeground, fontSize: fontSize.sm },
  unavailable: { color: color.destructiveForeground, fontSize: fontSize.sm },
});

type Status = { kind: "idle" | "submitting" | "joined" } | JoinOutcome;

/** The landing page's one call to action: an email and a button. */
export function WaitlistForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function submit({ email }: { email: string }) {
    setStatus({ kind: "submitting" });
    setStatus(await joinWaitlist(email));
  }

  if (status.kind === "joined") {
    return (
      <output {...stylex.props(styles.joined)}>
        You're on the list. We'll email you when Ouro is ready.
      </output>
    );
  }

  return (
    <Form<{ email: string }>
      xstyle={styles.form}
      // Only a problem with the address belongs on the field; an outage does
      // not make a valid address invalid.
      errors={status.kind === "invalid" ? { email: status.message } : undefined}
      onFormSubmit={submit}
    >
      <div {...stylex.props(styles.row)}>
        <Field name="email" xstyle={styles.field}>
          <FieldLabel xstyle={styles.hiddenLabel}>Email</FieldLabel>
          <Input type="email" required autoComplete="email" placeholder="you@example.com" />
          <FieldError />
        </Field>
        <Button type="submit" loading={status.kind === "submitting"}>
          Join the waitlist
        </Button>
      </div>
      {status.kind === "unavailable" && (
        <p role="alert" {...stylex.props(styles.unavailable)}>
          {status.message}
        </p>
      )}
    </Form>
  );
}
