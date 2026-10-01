/** Material 3 circular progress indicator (indeterminate), sized for use inside a button. */
export function Spinner({ className = "size-[18px]" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`animate-spin motion-reduce:animate-pulse ${className}`}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="40 60"
      />
    </svg>
  );
}
