'use client';

import { useState, type ReactNode } from 'react';
// Presentation-deck ornaments — Sadu weave, kingdom map, wave ground.
// Pure SVG/CSS; swap in official brand assets from public/brand/ when they arrive.

export function SaduPatternDefs({ id = 'snd-sadu' }: { id?: string }) {
  return (
    <defs>
      <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse">
        <rect width="24" height="24" fill="#0E8A46" />
        <path d="M0 0h12v12H0zM12 12h12v12H12z" fill="#4CB944" />
        <path d="M12 0h12v12H12zM0 12h12v12H0z" fill="#1F6BD6" opacity="0.85" />
        <path d="M6 6h6v6H6z" fill="#A32A5D" opacity="0.9" />
        <path d="M18 6h3v3h-3zM3 18h3v3H3z" fill="#F2ECDD" opacity="0.35" />
      </pattern>
    </defs>
  );
}

/** Stylized KSA map — Sadu fill above, terracotta skyline below (deck hero). */
export function KingdomMap({ className, compact = false }: { className?: string; compact?: boolean }) {
  const patternId = compact ? 'snd-sadu-compact' : 'snd-sadu-map';
  return (
    <svg
      viewBox="0 0 320 420"
      className={className}
      role="img"
      aria-label="خريطة المملكة العربية السعودية"
    >
      <SaduPatternDefs id={patternId} />
      <path
        d="M48 52c28-18 62-28 98-26 42 2 78 18 104 44 22 22 38 52 44 84 8 42-4 86-32 118-24 28-58 48-94 56-38 8-78 4-112-14C38 302 18 262 14 218 10 172 24 126 48 52z"
        fill={`url(#${patternId})`}
      />
      <clipPath id="skyline-clip">
        <path d="M48 52c28-18 62-28 98-26 42 2 78 18 104 44 22 22 38 52 44 84 8 42-4 86-32 118-24 28-58 48-94 56-38 8-78 4-112-14C38 302 18 262 14 218 10 172 24 126 48 52z" />
      </clipPath>
      <g clipPath="url(#skyline-clip)">
        <rect x="0" y="268" width="320" height="160" fill="#C55A2A" opacity="0.92" />
        <rect x="118" y="198" width="18" height="120" rx="2" fill="#8B3D1F" />
        <rect x="148" y="168" width="22" height="150" rx="2" fill="#6E3018" />
        <polygon points="159,168 169,148 179,168" fill="#6E3018" />
        <rect x="188" y="210" width="16" height="108" rx="2" fill="#8B3D1F" />
        <rect x="88" y="228" width="14" height="90" rx="2" fill="#A04828" opacity="0.8" />
        <rect x="210" y="240" width="12" height="78" rx="2" fill="#A04828" opacity="0.7" />
      </g>
    </svg>
  );
}

export function SaduBand({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`snd-sadu-band h-3 w-full ${className ?? ''}`}
    />
  );
}

/** Horizontal Sadu motif strip — official multi-motif guideline asset. */
export function SaduSleepingLine({ className }: { className?: string }) {
  return <div aria-hidden className={`snd-pattern-sleeping-line h-7 w-full sm:h-8 ${className ?? ''}`} />;
}

export function WaveOverlay({ className }: { className?: string }) {
  return (
    <div aria-hidden className={`snd-wave pointer-events-none absolute inset-0 ${className ?? ''}`} />
  );
}

/**
 * Official SND guideline ornaments — side motif strip + bottom diamond row.
 * Patterns use mix-blend-screen so their black backing disappears on snd.night.
 */
export function SndPatternFrame({
  children,
  className,
  side = true,
  bottom = true,
  purpleAccent = false,
}: {
  children: ReactNode;
  className?: string;
  side?: boolean;
  bottom?: boolean;
  purpleAccent?: boolean;
}) {
  return (
    <div className={`relative ${className ?? ''}`}>
      {purpleAccent && (
        <div aria-hidden className="snd-pattern-purple pointer-events-none absolute end-8 top-8 z-[1] h-48 w-48 sm:h-64 sm:w-64" />
      )}
      {side && (
        <div aria-hidden className="snd-pattern-side pointer-events-none absolute bottom-0 end-0 top-0 z-[1]" />
      )}
      {bottom && (
        <div aria-hidden className="snd-pattern-bottom pointer-events-none absolute inset-x-0 bottom-0 z-[1]" />
      )}
      <div className="relative z-10 flex h-full min-h-0 w-full flex-col">{children}</div>
    </div>
  );
}

export function SndTitleBlock({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <header className={className}>
      <h1 className="font-display text-5xl text-sand md:text-6xl">{title}</h1>
      {subtitle && <p className="mt-2 text-2xl text-sand/60">{subtitle}</p>}
      <div className="satorp-line-gradient mt-4 h-[3px] max-w-md rounded-full" />
    </header>
  );
}

export function ReignTab({
  active,
  name,
  range,
  onClick,
}: {
  active: boolean;
  name: string;
  range: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[88px] min-w-[88px] flex-1 rounded-2xl border px-3 py-4 text-center text-2xl font-semibold transition-all duration-200 ${
        active
          ? 'border-saudi/60 bg-saudi text-white shadow-[0_0_32px_rgba(14,138,70,0.35)]'
          : 'border-white/10 bg-white/5 text-sand/90 hover:bg-white/10'
      }`}
    >
      <span className="block leading-tight">{name}</span>
      <span className={`mt-1 block text-lg ${active ? 'text-white/80' : 'text-sand/50'}`}>{range}</span>
    </button>
  );
}

export function MilestoneChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[80px] min-w-[160px] rounded-2xl border px-6 text-2xl font-semibold transition-colors ${
        active
          ? 'border-sand/40 bg-sand text-night shadow-lg'
          : 'border-white/10 bg-white/5 text-sand hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );
}

export function TimelineMedia({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative h-[520px] w-[700px] shrink-0 overflow-hidden rounded-3xl border border-white/15 bg-night/40 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div className="snd-sadu-band absolute inset-x-0 top-0 z-10 h-2" />
      <div className="snd-sadu-band absolute inset-x-0 bottom-0 z-10 h-2" />
      {failed ? (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-night to-snd-grid">
          <KingdomMap className="h-4/5 w-4/5 opacity-70" />
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/90 to-transparent p-6 pt-16">
        <p className="font-display text-2xl text-sand/80">{title}</p>
      </div>
    </div>
  );
}
