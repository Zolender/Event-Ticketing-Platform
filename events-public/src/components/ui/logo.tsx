/** The Tiketi mark: a ticket on a rounded tile, the same drawing as the favicon (app/icon.svg). */
export function Logo({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        className="fill-on-primary"
        d="M6 10.5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2.2a3.3 3.3 0 0 0 0 6.6v2.2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2.2a3.3 3.3 0 0 0 0-6.6z"
      />
      <path
        d="M19.5 10.5v11"
        fill="none"
        strokeWidth="1.6"
        strokeDasharray="2 2"
        strokeLinecap="round"
        className="stroke-primary"
      />
    </svg>
  );
}
