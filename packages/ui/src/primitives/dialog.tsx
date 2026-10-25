import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ReactElement } from "react";
import { classes, type Styled } from "./classes";

// Root, trigger and close are Base UI's own; the rest add the portal,
// backdrop and slots so a caller composes only content.
export const Dialog = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;

export function DialogContent({
  className,
  ...props
}: Styled<BaseDialog.Popup.Props>): ReactElement {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="nm-dialog-backdrop" data-slot="dialog-backdrop" />
      <BaseDialog.Popup {...props} className={classes("nm-dialog", className)} data-slot="dialog" />
    </BaseDialog.Portal>
  );
}

export function DialogTitle({ className, ...props }: Styled<BaseDialog.Title.Props>): ReactElement {
  return (
    <BaseDialog.Title
      {...props}
      className={classes("nm-dialog-title", className)}
      data-slot="dialog-title"
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: Styled<BaseDialog.Description.Props>): ReactElement {
  return (
    <BaseDialog.Description
      {...props}
      className={classes("nm-dialog-description", className)}
      data-slot="dialog-description"
    />
  );
}
