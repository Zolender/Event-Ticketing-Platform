import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { ErrorIcon, WarningIcon } from "./icons";

type TextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "placeholder"
> & {
  id: string;
  label: string;
  /** Blocks: the field is invalid. Keep it to one line. */
  error?: string;
  /** Informs only: the field stays valid (e.g. Caps Lock). Keep it to one line. */
  warning?: string;
  /** A button or icon at the end of the field (48px square). */
  trailing?: ReactNode;
  ref?: Ref<HTMLInputElement>;
};

/**
 * Material 3 outlined text field. The label floats in the border, and sits inside only while the
 * field is empty, not focused and not autofilled (browsers autofill before the page sees a value).
 */
export function TextField({
  id,
  label,
  error,
  warning,
  trailing,
  className = "",
  ref,
  ...props
}: TextFieldProps) {
  const message = error ?? warning;
  const messageId = message ? `${id}-message` : undefined;
  const endSlot =
    trailing ?? (error ? <ErrorIcon className="size-6 text-error" /> : null);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="relative">
        {/* Autofill paints its own background; an inset shadow in the field's colour covers it. */}
        <input
          ref={ref}
          id={id}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          className={`peer h-14 w-full rounded-xs border border-outline bg-transparent px-4 text-body-lg text-on-surface outline-none focus:border-2 focus:border-primary focus:px-3.75 aria-invalid:border-error aria-invalid:focus:border-error autofill:shadow-[inset_0_0_0_100px_var(--field-bg,var(--color-surface))] autofill:[-webkit-text-fill-color:var(--color-on-surface)] ${endSlot ? "pr-12 focus:pr-12" : ""}`}
          {...props}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute top-0 left-3 -translate-y-1/2 bg-(--field-bg,var(--color-surface)) px-1 text-body-sm text-on-surface-variant transition-[top,font-size,line-height,color] duration-150 peer-[:placeholder-shown:not(:autofill):not(:focus)]:top-1/2 peer-[:placeholder-shown:not(:autofill):not(:focus)]:text-body-lg peer-focus:text-primary peer-aria-invalid:text-error motion-reduce:transition-none"
        >
          {label}
        </label>
        {endSlot && (
          <div className="absolute top-1 right-1 grid size-12 place-items-center text-on-surface-variant">
            {endSlot}
          </div>
        )}
      </div>
      {message && (
        <p
          id={messageId}
          className={`flex items-start gap-1.5 px-4 text-body-sm ${error ? "text-error" : "text-warning"}`}
        >
          {error ? (
            <ErrorIcon className="size-4 shrink-0" />
          ) : (
            <WarningIcon className="size-4 shrink-0" />
          )}
          <span>{message}</span>
        </p>
      )}
    </div>
  );
}
