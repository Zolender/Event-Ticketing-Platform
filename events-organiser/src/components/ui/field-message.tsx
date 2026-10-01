import { ErrorIcon, WarningIcon } from "./icons";

export type FieldMessageProps = {
  /** Blocks: the field is invalid. Keep it to one line. */
  error?: string;
  /** Informs only: the field stays valid. Keep it to one line. */
  warning?: string;
  /** Neutral help, shown when there is no error or warning. */
  supporting?: string;
  /** "12 / 200": shown for fields with a limit. */
  counter?: { length: number; max: number };
};

/** The line under a field. Errors win over warnings, warnings over help. */
export function FieldMessage({
  id,
  error,
  warning,
  supporting,
  counter,
}: FieldMessageProps & { id: string }) {
  const message = error ?? warning ?? supporting;
  if (!message && !counter) return null;
  const tone = error
    ? "text-error"
    : warning
      ? "text-warning"
      : "text-on-surface-variant";
  return (
    <div className="flex items-start gap-3 px-4 text-body-sm">
      {message && (
        <p id={id} className={`flex flex-1 items-start gap-1.5 ${tone}`}>
          {error && <ErrorIcon className="size-4 shrink-0" />}
          {!error && warning && <WarningIcon className="size-4 shrink-0" />}
          <span>{message}</span>
        </p>
      )}
      {counter && (
        <span
          className={`ml-auto tabular-nums ${counter.length > counter.max ? "text-error" : "text-on-surface-variant"}`}
        >
          {counter.length.toLocaleString("en-GB")} /{" "}
          {counter.max.toLocaleString("en-GB")}
        </span>
      )}
    </div>
  );
}

export function messageIdFor(id: string, props: FieldMessageProps) {
  return props.error || props.warning || props.supporting
    ? `${id}-message`
    : undefined;
}
