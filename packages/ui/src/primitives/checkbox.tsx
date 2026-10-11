import * as stylex from "@stylexjs/stylex";
import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import type { ReactElement } from "react";
import { color, media, motion, shadow } from "../tokens/tokens.stylex";

// coss checkbox. Base UI reports state as attributes on the root
// (data-checked, data-disabled, aria-invalid); the styles key on them.
const CHECKED = ":is([data-checked])";
const DISABLED = ":is([data-disabled])";
const INVALID = ":is([aria-invalid=true])";

const styles = stylex.create({
  root: {
    position: "relative",
    display: "inline-flex",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    width: { default: "1.125rem", [media.sm]: "1rem" },
    height: { default: "1.125rem", [media.sm]: "1rem" },
    padding: 0,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: {
      default: color.input,
      [INVALID]: `color-mix(in srgb, ${color.destructive} 36%, transparent)`,
    },
    borderRadius: "0.25rem",
    backgroundColor: {
      default: color.background,
      [media.dark]: `color-mix(in srgb, ${color.input} 32%, transparent)`,
    },
    boxShadow: {
      default: shadow.xs,
      [CHECKED]: "none",
      [INVALID]: "none",
      ":focus-visible": `0 0 0 ${shadow.focusOffset} ${color.background}, 0 0 0 ${shadow.focusWidth} ${color.ring}`,
    },
    outline: "none",
    cursor: { default: "pointer", [DISABLED]: "not-allowed" },
    opacity: { default: null, [DISABLED]: 0.64 },
    transitionProperty: "box-shadow",
    transitionDuration: motion.fast,
    transitionTimingFunction: motion.ease,
  },
  indicator: {
    position: "absolute",
    inset: "-1px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "0.25rem",
    backgroundColor: color.primary,
    color: color.primaryForeground,
  },
  icon: {
    width: { default: "0.875rem", [media.sm]: "0.75rem" },
    height: { default: "0.875rem", [media.sm]: "0.75rem" },
  },
});

export type CheckboxProps = Omit<BaseCheckbox.Root.Props, "className" | "style"> & {
  xstyle?: stylex.StyleXStyles;
};

/**
 * `import { Checkbox } from "@ouro/ui/checkbox"`. Inside `Field` it takes
 * the field's label and validity; with `name` it submits with its form.
 */
export function Checkbox({ xstyle, ...props }: CheckboxProps): ReactElement {
  return (
    <BaseCheckbox.Root {...stylex.props(styles.root, xstyle)} data-slot="checkbox" {...props}>
      <BaseCheckbox.Indicator {...stylex.props(styles.indicator)} data-slot="checkbox-indicator">
        <svg
          aria-hidden="true"
          {...stylex.props(styles.icon)}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
          viewBox="0 0 24 24"
        >
          <path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
        </svg>
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}
