import { Button as BaseButton } from "@base-ui/react/button";
import type { ReactElement } from "react";

// Geometry and color live in styles/components.css as `nm-btn` classes driven
// by component variables; the props below only choose which classes apply.

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "brand"
  | "danger"
  | "danger-subtle"
  | "transparent"
  | "link"
  | "link-brand"
  | "link-danger";

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

export type ButtonProps = Omit<BaseButton.Props, "className" | "style"> & {
  /** Layout only (margin, width); color and type come from the variant. */
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: "rounded" | "pill";
  /** A square button holding one icon; give it an `aria-label`. */
  iconOnly?: boolean;
  /** Shows a spinner and ignores clicks, while keeping focus. */
  pending?: boolean;
};

/** `import { Button } from "@nomi/ui/button"`. Pass `render={<a />}` for a link. */
export function Button({
  variant = "primary",
  size = "md",
  shape = "rounded",
  iconOnly = false,
  pending = false,
  disabled,
  render,
  className,
  children,
  ...props
}: ButtonProps): ReactElement {
  const classes = [
    "nm-btn",
    `nm-btn-${size}`,
    `nm-btn-${variant}`,
    shape === "pill" && "nm-btn-pill",
    iconOnly && "nm-btn-icon-only",
    className,
  ];
  return (
    <BaseButton
      // A rendered <a> or custom element is not a native button.
      nativeButton={!render}
      {...props}
      render={render}
      className={classes.filter(Boolean).join(" ")}
      disabled={disabled || pending}
      focusableWhenDisabled={pending}
      aria-busy={pending || undefined}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-pending={pending ? "" : undefined}
    >
      <span className="nm-btn-content">{children}</span>
    </BaseButton>
  );
}
