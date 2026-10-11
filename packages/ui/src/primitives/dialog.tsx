import * as stylex from "@stylexjs/stylex";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { ReactElement } from "react";
import {
  color,
  font,
  fontSize,
  fontWeight,
  lineHeight,
  media,
  motion,
  radius,
  shadow,
  space,
} from "../tokens/tokens.stylex";
import { Button } from "./button";

// coss dialog. coss's `max-sm:` variants become the defaults here, with the
// centered layout under `media.sm`: below it the popup sticks to the bottom
// of the screen as a sheet. The panel owns the gap under the header with
// padding instead of coss's `in-[…:has(…)]` selectors, and scrolls natively
// rather than through coss's ScrollArea.

const STARTING = ":is([data-starting-style])";
const ENDING = ":is([data-ending-style])";

const styles = stylex.create({
  backdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "oklch(0 0 0 / 32%)",
    backdropFilter: "blur(4px)",
    opacity: { default: 1, [STARTING]: 0, [ENDING]: 0 },
    transitionProperty: "opacity",
    transitionDuration: "200ms",
    transitionTimingFunction: motion.ease,
  },
  viewport: {
    position: "fixed",
    inset: 0,
    display: "grid",
    gridTemplateRows: { default: "1fr auto", [media.sm]: "1fr auto 3fr" },
    justifyItems: "center",
    padding: { default: null, [media.sm]: space.s4 },
    paddingTop: { default: space.s12, [media.sm]: space.s4 },
  },
  popup: {
    position: "relative",
    gridRowStart: 2,
    display: "flex",
    flexDirection: "column",
    width: "100%",
    minWidth: 0,
    maxWidth: { default: "none", [media.sm]: "32rem" },
    maxHeight: "100%",
    minHeight: 0,
    transformOrigin: { default: "bottom", [media.sm]: "center" },
    borderWidth: { default: "1px 0 0", [media.sm]: 1 },
    borderStyle: "solid",
    borderColor: color.border,
    borderRadius: { default: 0, [media.sm]: radius.xxl },
    backgroundColor: color.popover,
    backgroundClip: { default: "padding-box", [media.dark]: null },
    color: color.popoverForeground,
    boxShadow: shadow.lg,
    outline: "none",
    opacity: { default: 1, [STARTING]: 0, [ENDING]: 0 },
    translate: {
      default: null,
      [STARTING]: { default: "0 1rem", [media.sm]: null },
      [ENDING]: { default: "0 1rem", [media.sm]: null },
    },
    scale: {
      default: null,
      [STARTING]: { default: null, [media.sm]: "0.98" },
      [ENDING]: { default: null, [media.sm]: "0.98" },
    },
    transitionProperty: "scale, opacity, translate",
    transitionDuration: "200ms",
    transitionTimingFunction: "ease-in-out",
    "::before": {
      content: "''",
      display: { default: "none", [media.sm]: "block" },
      position: "absolute",
      inset: 0,
      borderRadius: `calc(${radius.xxl} - 1px)`,
      boxShadow: color.highlight,
      pointerEvents: "none",
    },
  },
  close: { position: "absolute", insetInlineEnd: space.s2, top: space.s2 },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: space.s2,
    padding: space.s6,
    paddingBottom: { default: space.s4, [media.sm]: space.s3 },
  },
  title: {
    fontFamily: font.heading,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.none,
  },
  description: { color: color.mutedForeground, fontSize: fontSize.sm, lineHeight: lineHeight.sm },
  panel: {
    minHeight: 0,
    overflowY: "auto",
    overscrollBehavior: "contain",
    padding: space.s6,
    paddingTop: space.s1,
  },
});

/** `import { Dialog } from "@ouro/ui/dialog"`: owns the open state. */
export const Dialog: typeof BaseDialog.Root = BaseDialog.Root;

export function DialogTrigger(props: BaseDialog.Trigger.Props): ReactElement {
  return <BaseDialog.Trigger data-slot="dialog-trigger" {...props} />;
}

export type DialogPopupProps = Omit<BaseDialog.Popup.Props, "className" | "style"> & {
  showCloseButton?: boolean;
  xstyle?: stylex.StyleXStyles;
};

/** The portaled popup with its backdrop, centered from `sm` up and a bottom sheet below. */
export function DialogPopup({
  children,
  showCloseButton = true,
  xstyle,
  ...props
}: DialogPopupProps): ReactElement {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop {...stylex.props(styles.backdrop)} data-slot="dialog-backdrop" />
      <BaseDialog.Viewport {...stylex.props(styles.viewport)} data-slot="dialog-viewport">
        <BaseDialog.Popup
          {...stylex.props(styles.popup, xstyle)}
          data-slot="dialog-popup"
          {...props}
        >
          {children}
          {showCloseButton && (
            <BaseDialog.Close
              aria-label="Close"
              render={<Button size="icon" variant="ghost" xstyle={styles.close} />}
            >
              <svg
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </BaseDialog.Close>
          )}
        </BaseDialog.Popup>
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  );
}

type PartProps = Omit<useRender.ComponentProps<"div">, "className" | "style"> & {
  xstyle?: stylex.StyleXStyles;
};

function useDialogPart(part: "header" | "panel", { render, xstyle, ...props }: PartProps) {
  const ownProps = { ...stylex.props(styles[part], xstyle), "data-slot": `dialog-${part}` };
  return useRender({ defaultTagName: "div", render, props: mergeProps<"div">(ownProps, props) });
}

export function DialogHeader(props: PartProps): ReactElement {
  return useDialogPart("header", props);
}

/** The dialog's body; it scrolls when the popup reaches the viewport's height. */
export function DialogPanel(props: PartProps): ReactElement {
  return useDialogPart("panel", props);
}

type TextProps<P> = Omit<P, "className" | "style"> & { xstyle?: stylex.StyleXStyles };

export function DialogTitle({ xstyle, ...props }: TextProps<BaseDialog.Title.Props>): ReactElement {
  return (
    <BaseDialog.Title {...stylex.props(styles.title, xstyle)} data-slot="dialog-title" {...props} />
  );
}

export function DialogDescription({
  xstyle,
  ...props
}: TextProps<BaseDialog.Description.Props>): ReactElement {
  return (
    <BaseDialog.Description
      {...stylex.props(styles.description, xstyle)}
      data-slot="dialog-description"
      {...props}
    />
  );
}
