import type { ButtonHTMLAttributes } from "react";

const variants = {
  filled: "bg-primary text-on-primary before:bg-on-primary",
  tonal:
    "bg-secondary-container text-on-secondary-container before:bg-on-secondary-container",
  outlined: "border border-outline text-primary before:bg-primary",
  text: "text-primary before:bg-primary",
  /** On a primary-container band, where the usual filled button would vanish. */
  "on-container":
    "bg-on-primary-container text-primary-container before:bg-primary-container",
};

export type ButtonVariant = keyof typeof variants;

/** Material 3 button look, for buttons and for links that act as buttons. */
export function buttonClass(variant: ButtonVariant = "filled", extra = "") {
  return `relative inline-flex h-10 shrink-0 cursor-pointer pointer-coarse:h-12 items-center justify-center gap-2 overflow-hidden rounded-full px-6 text-label-lg whitespace-nowrap before:absolute before:inset-0 before:opacity-0 before:transition-opacity hover:before:opacity-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary focus-visible:before:opacity-10 active:before:opacity-10 disabled:pointer-events-none disabled:opacity-38 ${variants[variant]} ${extra}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

/** Material 3 button: pill shape, label-large text, a state layer on hover, focus and press. */
export function Button({
  variant = "filled",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, className)}
      {...props}
    />
  );
}
