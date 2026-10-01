import type { Ref, TextareaHTMLAttributes } from "react";
import {
  FieldMessage,
  messageIdFor,
  type FieldMessageProps,
} from "./field-message";

type TextAreaFieldProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "placeholder"
> &
  FieldMessageProps & {
    id: string;
    label: string;
    ref?: Ref<HTMLTextAreaElement>;
  };

/** The outlined text field for several lines. The label rests on the first line while empty. */
export function TextAreaField({
  id,
  label,
  error,
  warning,
  supporting,
  counter,
  className = "",
  ref,
  rows = 5,
  ...props
}: TextAreaFieldProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="relative">
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={messageIdFor(id, { error, warning, supporting })}
          className="peer block min-h-28 w-full resize-y rounded-xs border border-outline bg-transparent px-4 py-4 text-body-lg text-on-surface outline-none focus:border-2 focus:border-primary focus:px-3.75 focus:py-3.75 aria-invalid:border-error aria-invalid:focus:border-error"
          {...props}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute top-0 left-3 -translate-y-1/2 bg-(--field-bg,var(--color-surface)) px-1 text-body-sm text-on-surface-variant transition-[top,font-size,line-height,color] duration-150 peer-[:placeholder-shown:not(:focus)]:top-7 peer-[:placeholder-shown:not(:focus)]:text-body-lg peer-focus:text-primary peer-aria-invalid:text-error motion-reduce:transition-none"
        >
          {label}
        </label>
      </div>
      <FieldMessage
        id={`${id}-message`}
        error={error}
        warning={warning}
        supporting={supporting}
        counter={counter}
      />
    </div>
  );
}
