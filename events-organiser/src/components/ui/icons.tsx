// Paths from Google's Material icons (Apache 2.0), inlined so no icon font is downloaded.
type IconProps = { className?: string };

function Icon({ path, className = "size-6" }: IconProps & { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`fill-current ${className}`}
    >
      <path d={path} />
    </svg>
  );
}

export const VisibilityIcon = (props: IconProps) => (
  <Icon
    {...props}
    path="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
  />
);

export const VisibilityOffIcon = (props: IconProps) => (
  <Icon
    {...props}
    path="M12 7a5 5 0 0 1 5 5c0 .65-.13 1.26-.36 1.83l2.92 2.92A11.82 11.82 0 0 0 23 12c-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.8 11.8 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65a3 3 0 0 0 3 3c.22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53a5 5 0 0 1-5-5c0-.79.2-1.53.53-2.2z"
  />
);

export const ErrorIcon = (props: IconProps) => (
  <Icon
    {...props}
    path="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
  />
);

export const WarningIcon = (props: IconProps) => (
  <Icon {...props} path="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
);

export const InfoIcon = (props: IconProps) => (
  <Icon
    {...props}
    path="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
  />
);

export const AddIcon = (props: IconProps) => (
  <Icon {...props} path="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
);

export const EventsIcon = (props: IconProps) => (
  <Icon
    {...props}
    path="M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4a2 2 0 1 1 0 4v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 1 1 0-4z"
  />
);

export const LiveIcon = (props: IconProps) => (
  <Icon
    {...props}
    path="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm-9 4a9 9 0 0 1 2.64-6.36l1.42 1.42A7 7 0 0 0 5 12a7 7 0 0 0 2.06 4.94l-1.42 1.42A9 9 0 0 1 3 12zm16.36-6.36A9 9 0 0 1 21 12a9 9 0 0 1-2.64 6.36l-1.42-1.42A7 7 0 0 0 19 12a7 7 0 0 0-2.06-4.94l1.42-1.42z"
  />
);

export const DraftIcon = (props: IconProps) => (
  <Icon
    {...props}
    path="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
  />
);

export const HistoryIcon = (props: IconProps) => (
  <Icon
    {...props}
    path="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.95 8.95 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"
  />
);

export const BackIcon = (props: IconProps) => (
  <Icon
    {...props}
    path="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
  />
);

export const PlaceIcon = (props: IconProps) => (
  <Icon
    {...props}
    path="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
  />
);

export const ScheduleIcon = (props: IconProps) => (
  <Icon
    {...props}
    path="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"
  />
);

export const MenuIcon = (props: IconProps) => (
  <Icon {...props} path="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
);

export const SignOutIcon = (props: IconProps) => (
  <Icon
    {...props}
    path="M10.09 15.59 11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5a2 2 0 0 0-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"
  />
);
