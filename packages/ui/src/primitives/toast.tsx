import * as stylex from "@stylexjs/stylex";
import { Toast } from "@base-ui/react/toast";
import type { ReactElement } from "react";
import {
  color,
  fontSize,
  fontWeight,
  lineHeight,
  media,
  radius,
  shadow,
  space,
} from "../tokens/tokens.stylex";
import { Button } from "./button";

// coss toast (packages/ui/src/components/toast.tsx), stacked variant. The
// stacking geometry is arithmetic on the variables Base UI sets per toast
// (`--toast-index`, `--toast-offset-y`, `--toast-swipe-movement-*`) under
// compound state selectors (`[data-position*=top][data-ending-style]...`);
// that lives in base.css (`[data-slot=toast]`). The surface lives here.

const EXPANDED = ":is([data-expanded])";
const BEHIND = ":is([data-behind]:not([data-expanded]))";
const spin = stylex.keyframes({ to: { rotate: "360deg" } });

const styles = stylex.create({
  root: {
    userSelect: "none",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: color.border,
    borderRadius: radius.lg,
    // Toasts behind the front one darken a step each (`--toast-darken`, base.css).
    backgroundColor: {
      default: `color-mix(in srgb, ${color.popover}, black calc(var(--toast-darken) * max(0, var(--toast-index, 0))))`,
      [EXPANDED]: color.popover,
    },
    backgroundClip: { default: "padding-box", [media.dark]: null },
    color: color.popoverForeground,
    boxShadow: shadow.lg,
    "::before": {
      content: "''",
      position: "absolute",
      inset: 0,
      borderRadius: `calc(${radius.lg} - 1px)`,
      boxShadow: color.highlight,
      pointerEvents: "none",
    },
  },
  content: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.s1_5,
    overflow: "hidden",
    paddingBlock: space.s3,
    paddingInline: space.s3_5,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    pointerEvents: { default: "auto", [BEHIND]: "none" },
    opacity: { default: 1, [BEHIND]: 0 },
    transitionProperty: "opacity",
    transitionDuration: "250ms",
  },
  body: { display: "flex", gap: space.s2 },
  text: { display: "flex", flexDirection: "column", gap: space.s0_5 },
  // Base UI renders the title as an <h2>; it takes the toast's text size.
  title: { fontSize: "inherit", fontWeight: fontWeight.medium },
  description: { color: color.mutedForeground },
  icon: { flexShrink: 0, width: "1rem", height: "1lh", pointerEvents: "none" },
  loading: {
    opacity: 0.8,
    animationName: spin,
    animationDuration: { default: "1s", [media.reducedMotion]: "2s" },
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
  },
  error: { color: color.destructive },
  info: { color: color.info },
  success: { color: color.success },
  warning: { color: color.warning },
});

// lucide: circle-alert, info, loader-circle, circle-check, triangle-alert.
const ICON_PATHS = {
  error: ["M12 8v4", "M12 16h.01"],
  info: ["M12 16v-4", "M12 8h.01"],
  loading: ["M21 12a9 9 0 1 1-6.219-8.56"],
  success: ["m9 12 2 2 4-4"],
  warning: [
    "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
    "M12 9v4",
    "M12 17h.01",
  ],
} as const;

type ToastType = keyof typeof ICON_PATHS;
const isToastType = (type: string | undefined): type is ToastType =>
  type !== undefined && type in ICON_PATHS;

function ToastIcon({ type }: { type: ToastType }) {
  const circled = type !== "warning" && type !== "loading";
  return (
    <svg
      aria-hidden
      data-slot="toast-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...stylex.props(styles.icon, type === "loading" ? styles.loading : styles[type])}
    >
      {circled && <circle cx="12" cy="12" r="10" />}
      {ICON_PATHS[type].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

type SwipeDirection = "up" | "down" | "left" | "right";

function swipeDirections(position: ToastPosition): SwipeDirection[] {
  const vertical = position.startsWith("top") ? "up" : "down";
  if (position.includes("center")) return [vertical];
  return [position.includes("left") ? "left" : "right", vertical];
}

function Toasts({ position }: { position: ToastPosition }): ReactElement {
  const { toasts } = Toast.useToastManager();
  const swipeDirection = swipeDirections(position);
  return (
    <Toast.Portal data-slot="toast-portal">
      <Toast.Viewport data-position={position} data-slot="toast-viewport">
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            toast={toast}
            swipeDirection={swipeDirection}
            data-position={position}
            data-slot="toast"
            {...stylex.props(styles.root)}
          >
            <Toast.Content {...stylex.props(styles.content)}>
              <div {...stylex.props(styles.body)}>
                {isToastType(toast.type) && <ToastIcon type={toast.type} />}
                <div {...stylex.props(styles.text)}>
                  <Toast.Title data-slot="toast-title" {...stylex.props(styles.title)} />
                  <Toast.Description
                    data-slot="toast-description"
                    {...stylex.props(styles.description)}
                  />
                </div>
              </div>
              {toast.actionProps && (
                <Toast.Action data-slot="toast-action" render={<Button size="xs" />}>
                  {toast.actionProps.children}
                </Toast.Action>
              )}
            </Toast.Content>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

/**
 * Adds, updates and closes toasts from anywhere:
 * `toastManager.add({ title, description, type })`. Adding with an `id`
 * already shown updates that toast instead of stacking another.
 */
export const toastManager: ReturnType<typeof Toast.createToastManager> = Toast.createToastManager();

export type ToastProviderProps = Omit<Toast.Provider.Props, "toastManager"> & {
  position?: ToastPosition;
};

/**
 * `import { ToastProvider, toastManager } from "@ouro/ui/toast"`. Render
 * once around the app; toasts stack in one corner and expand on hover.
 */
export function ToastProvider({
  children,
  position = "bottom-right",
  ...props
}: ToastProviderProps): ReactElement {
  return (
    <Toast.Provider toastManager={toastManager} {...props}>
      {children}
      <Toasts position={position} />
    </Toast.Provider>
  );
}
