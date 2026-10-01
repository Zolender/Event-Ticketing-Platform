import type { ButtonHTMLAttributes } from "react";

const variants = {
  filled: "bg-primary text-on-primary before:bg-on-primary",
  outlined: "border border-outline text-primary before:bg-primary",
  text: "text-primary before:bg-primary",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
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
      className={`relative inline-flex h-10 cursor-pointer pointer-coarse:h-12 items-center justify-center gap-2 overflow-hidden rounded-full px-6 text-label-lg before:absolute before:inset-0 before:opacity-0 before:transition-opacity hover:before:opacity-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary focus-visible:before:opacity-10 active:before:opacity-10 disabled:pointer-events-none disabled:opacity-38 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
