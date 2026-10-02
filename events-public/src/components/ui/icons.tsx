// Paths from Google's Material icons (Apache 2.0), inlined so no icon font is downloaded.
type IconProps = { className?: string };

function Icon({ path, className = "size-6" }: IconProps & { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`shrink-0 fill-current ${className}`}
    >
      <path d={path} />
    </svg>
  );
}

export const ErrorIcon = (props: IconProps) => (
  <Icon
    {...props}
    path="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
  />
);

export const InfoIcon = (props: IconProps) => (
  <Icon
    {...props}
    path="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
  />
);

export const OfflineIcon = (props: IconProps) => (
  <Icon
    {...props}
    path="M24 15c0-2.64-2.05-4.78-4.65-4.96A7.49 7.49 0 0 0 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46A5.5 5.5 0 0 1 17.5 10.5v.5H19a3 3 0 0 1 3 3c0 1.13-.64 2.11-1.56 2.62l1.45 1.45C23.16 17.16 24 16.18 24 15zM3 5.27l2.75 2.74C2.56 8.15 0 10.77 0 14c0 3.31 2.69 6 6 6h11.73l2 2L21 20.73 4.27 4 3 5.27zM7.73 10l8 8H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h1.73z"
  />
);

export const TicketIcon = (props: IconProps) => (
  <Icon
    {...props}
    path="M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4a2 2 0 1 1 0 4v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 1 1 0-4zm-2-1.46a4 4 0 0 0 0 6.92V18H4v-2.54a4 4 0 0 0 0-6.92V6h16v2.54z"
  />
);

export const CalendarIcon = (props: IconProps) => (
  <Icon
    {...props}
    path="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"
  />
);

export const EventBusyIcon = (props: IconProps) => (
  <Icon
    {...props}
    path="M9.31 17l2.44-2.44L14.19 17l1.06-1.06-2.44-2.44 2.44-2.44-1.06-1.06-2.44 2.44-2.44-2.44-1.06 1.06 2.44 2.44-2.44 2.44L9.31 17zM19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V8h14v11z"
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

export const ShareIcon = (props: IconProps) => (
  <Icon
    {...props}
    path="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11A2.99 2.99 0 0 0 21 5a3 3 0 1 0-5.91.7L8.04 9.81A2.99 2.99 0 0 0 3 12a3 3 0 0 0 5.04 2.19l7.12 4.16c-.05.21-.08.43-.08.65A2.92 2.92 0 1 0 18 16.08z"
  />
);

export const LinkIcon = (props: IconProps) => (
  <Icon
    {...props}
    path="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"
  />
);

export const SearchIcon = (props: IconProps) => (
  <Icon
    {...props}
    path="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
  />
);

export const CloseIcon = (props: IconProps) => (
  <Icon
    {...props}
    path="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
  />
);

export const BackIcon = (props: IconProps) => (
  <Icon
    {...props}
    path="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
  />
);

export const ChevronRightIcon = (props: IconProps) => (
  <Icon {...props} path="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
);
