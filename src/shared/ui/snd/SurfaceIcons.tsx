// Dev-launcher surface icons — white via currentColor (inherits sand/bright from cards).

type IconProps = { className?: string };

function MaskIcon({ src, className }: { src: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 ${className ?? ''}`}
      style={{
        backgroundColor: 'currentColor',
        WebkitMaskImage: `url(${src})`,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskImage: `url(${src})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
      }}
    />
  );
}

export function BoothIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <rect x="10" y="6" width="28" height="36" rx="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="36" r="2" fill="currentColor" />
      <path d="M16 12h16M16 17h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M32 8l3-2 3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function WallIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <rect x="4" y="10" width="40" height="26" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M4 18h40" stroke="currentColor" strokeWidth="1.5" />
      <rect x="10" y="24" width="8" height="6" rx="1" fill="currentColor" opacity="0.95" />
      <rect x="20" y="24" width="8" height="6" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="30" y="24" width="8" height="6" rx="1" fill="currentColor" opacity="0.45" />
      <path d="M20 40h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function TimelineIcon({ className }: IconProps) {
  return <MaskIcon src="/brand/saudi-map-icon.png" className={className} />;
}

export function ParticipationIcon({ className }: IconProps) {
  return <MaskIcon src="/brand/participation-sheet-icon.png" className={className} />;
}

export function ConsoleIcon({ className }: IconProps) {
  return <MaskIcon src="/brand/console-circuit-icon.png" className={className} />;
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
      <path d="M34 10l2-1M38 14h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
