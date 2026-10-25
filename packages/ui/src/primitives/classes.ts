/** Props of a Base UI part, with `className` narrowed to a layout-only string. */
export type Styled<Props> = Omit<Props, "className" | "style"> & { className?: string };

/** Joins class names, dropping the falsy ones. No conflict resolution: callers pass layout only. */
export function classes(...names: (string | false | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}
