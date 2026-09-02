// Dev-launcher surface icons — stroke + SND green accent (guideline style).

type IconProps = { className?: string };

export function BoothIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <rect x="10" y="6" width="28" height="36" rx="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="36" r="2" fill="#4CB944" />
      <path d="M16 12h16M16 17h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M32 8l3-2 3 2" stroke="#4CB944" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function WallIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <rect x="4" y="10" width="40" height="26" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M4 18h40" stroke="currentColor" strokeWidth="1.5" />
      <rect x="10" y="24" width="8" height="6" rx="1" fill="#4CB944" opacity="0.85" />
      <rect x="20" y="24" width="8" height="6" rx="1" fill="#4CB944" opacity="0.55" />
      <rect x="30" y="24" width="8" height="6" rx="1" fill="#4CB944" opacity="0.35" />
      <path d="M20 40h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function TimelineIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <path d="M8 38V14l16-8 16 8v24" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M24 6v32M8 38h32" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="24" cy="22" r="4" fill="#4CB944" />
      <path d="M34 12l2-2M36 18h3" stroke="#4CB944" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ParticipationIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <rect x="8" y="28" width="6" height="10" rx="1" fill="#4CB944" opacity="0.5" />
      <rect x="18" y="20" width="6" height="18" rx="1" fill="#4CB944" opacity="0.75" />
      <rect x="28" y="12" width="6" height="26" rx="1" fill="#4CB944" />
      <path d="M6 38h36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M36 8l3 1 1 3" stroke="#4CB944" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ConsoleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <rect x="6" y="12" width="36" height="22" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M6 36h36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="23" r="2" fill="#4CB944" />
      <circle cx="24" cy="23" r="2" fill="#4CB944" opacity="0.7" />
      <circle cx="32" cy="23" r="2" fill="#4CB944" opacity="0.45" />
    </svg>
  );
}

export function HighlightsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <path
        d="M24 8l4.5 9 10 1.5-7.5 7 2 10L24 31l-9 4.5 2-10-7.5-7 10-1.5L24 8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M34 10l2-1M38 14h2" stroke="#4CB944" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export const SURFACE_ICONS = {
  booth: BoothIcon,
  wall: WallIcon,
  timeline: TimelineIcon,
  participation: ParticipationIcon,
  console: ConsoleIcon,
  highlights: HighlightsIcon,
} as const;

export type SurfaceIconId = keyof typeof SURFACE_ICONS;
