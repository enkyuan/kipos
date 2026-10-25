import { Input as BaseInput } from "@base-ui/react/input";
import type { ComponentProps, ReactElement } from "react";
import { classes, type Styled } from "./classes";

export type InputProps = Omit<Styled<BaseInput.Props>, "size"> & { size?: "sm" | "md" | "lg" };

/** `import { Input } from "@nomi/ui/input"`. Wrap in a Base UI `Field` for label and error wiring. */
export function Input({ size = "md", className, ...props }: InputProps): ReactElement {
  return (
    <BaseInput
      {...props}
      className={classes("nm-input", `nm-input-${size}`, className)}
      data-slot="input"
      data-size={size}
    />
  );
}

export type TextareaProps = Omit<ComponentProps<"textarea">, "size"> & {
  size?: "sm" | "md" | "lg";
};

export function Textarea({ size = "md", className, ...props }: TextareaProps): ReactElement {
  return (
    <textarea
      {...props}
      className={classes("nm-input", "nm-textarea", `nm-input-${size}`, className)}
      data-slot="textarea"
      data-size={size}
    />
  );
}
