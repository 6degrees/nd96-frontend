'use client';

import { useEffect, useState, type ReactNode } from 'react';
// Presentation-deck ornaments — Sadu weave, wave ground.
// Pure SVG/CSS; swap in official brand assets from public/brand/ when they arrive.

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

/** Three small trapezoid gems — title/body dividers from the message-screen reference. */
export function MotifTriple({
  className,
  tone = 'bright',
}: {
  className?: string;
  tone?: 'bright' | 'cyan';
}) {
  const fill = tone === 'cyan' ? '#7EB8D8' : '#4CB944';
  return (
    <div aria-hidden className={`flex items-center justify-center gap-2.5 ${className ?? ''}`}>
      {[0, 1, 2].map((i) => (
        <svg key={i} width="14" height="12" viewBox="0 0 14 12" className="shrink-0">
          <path d="M3 0h8l3 12H0Z" fill={fill} />
        </svg>
      ))}
    </div>
  );
}

/** Title flanked by sleeping-line chevrons (message-screen header rail). */
export function MessageTitleRail({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  return (
    <div className={`flex w-full max-w-5xl flex-col items-center gap-5 ${className ?? ''}`}>
      <MotifTriple />
      <div className="flex w-full items-center gap-5 sm:gap-8">
        <div aria-hidden className="snd-pattern-sleeping-line h-5 min-w-0 flex-1 sm:h-6" />
        <h2 className="font-display shrink-0 text-center text-4xl leading-tight text-sand sm:text-5xl md:text-6xl lg:text-7xl">
          {title}
        </h2>
        <div aria-hidden className="snd-pattern-sleeping-line h-5 min-w-0 flex-1 scale-x-[-1] sm:h-6" />
      </div>
      <MotifTriple />
    </div>
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
  bothSides = false,
}: {
  children: ReactNode;
  className?: string;
  side?: boolean;
  bottom?: boolean;
  purpleAccent?: boolean;
  /** When true, weave strips on both physical left and right (message screens). */
  bothSides?: boolean;
}) {
  return (
    <div className={`relative ${className ?? ''}`}>
      {purpleAccent && (
        <div aria-hidden className="snd-pattern-purple pointer-events-none absolute end-8 top-8 z-[1] h-48 w-48 sm:h-64 sm:w-64" />
      )}
      {side && !bothSides && (
        <div aria-hidden className="snd-pattern-side pointer-events-none absolute bottom-0 end-0 top-0 z-[1]" />
      )}
      {side && bothSides && (
        <>
          <div aria-hidden className="snd-pattern-side snd-pattern-side--left pointer-events-none absolute bottom-0 start-0 top-0 z-[1]" />
          <div aria-hidden className="snd-pattern-side snd-pattern-side--right pointer-events-none absolute bottom-0 end-0 top-0 z-[1]" />
        </>
      )}
      {bottom && (
        <div aria-hidden className="snd-pattern-bottom pointer-events-none absolute inset-x-0 bottom-0 z-[1]" />
      )}
      {children}
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
  className,
}: {
  active: boolean;
  name: string;
  range: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[80px] min-w-[7.5rem] shrink-0 rounded-2xl border px-3 py-3 text-center text-xl font-semibold transition-all duration-200 sm:min-h-[88px] sm:min-w-[8.5rem] sm:text-2xl ${
        active
          ? 'border-saudi/60 bg-saudi text-white shadow-[0_0_32px_rgba(14,138,70,0.35)]'
          : 'border-white/10 bg-white/5 text-sand/90 hover:bg-white/10'
      } ${className ?? ''}`}
    >
      <span className="block leading-tight">{name}</span>
      <span className={`mt-1 block text-base sm:text-lg ${active ? 'text-white/80' : 'text-sand/50'}`}>{range}</span>
    </button>
  );
}

export function MilestoneChip({
  active,
  label,
  sublabel,
  onClick,
}: {
  active: boolean;
  label: string;
  sublabel?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[80px] min-w-[10rem] max-w-[14rem] rounded-2xl border px-5 py-3 text-center transition-colors ${
        active
          ? 'border-sand/40 bg-sand text-night shadow-lg'
          : 'border-white/10 bg-white/5 text-sand hover:bg-white/10'
      }`}
    >
      <span className="block text-2xl font-semibold">{label}</span>
      {sublabel && (
        <span className={`mt-1 block truncate text-base leading-snug ${active ? 'text-night/65' : 'text-sand/50'}`}>
          {sublabel}
        </span>
      )}
    </button>
  );
}

export function TimelineMedia({
  src,
  title,
  placeholder,
}: {
  src: string;
  title: string;
  placeholder: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div className="relative h-[520px] w-[700px] shrink-0 overflow-hidden rounded-3xl border border-saudi/25 bg-snd-grid/80 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div aria-hidden className="snd-pattern-sleeping-line absolute inset-x-0 top-0 z-10 h-2 opacity-90" />
      <div aria-hidden className="snd-pattern-sleeping-line absolute inset-x-0 bottom-0 z-10 h-2 opacity-90" />
      {failed ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-snd-grid to-night px-8">
          <svg aria-hidden width="56" height="56" viewBox="0 0 56 56" fill="none" className="text-sand/25">
            <rect x="6" y="10" width="44" height="36" rx="4" stroke="currentColor" strokeWidth="2" />
            <circle cx="20" cy="24" r="4" stroke="currentColor" strokeWidth="2" />
            <path d="M6 38l14-12 10 8 8-6 12 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p className="font-display text-center text-2xl text-sand/45">{placeholder}</p>
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      )}
      {!failed && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/90 to-transparent p-6 pt-16">
          <p className="font-display text-2xl text-sand/80">{title}</p>
        </div>
      )}
    </div>
  );
}
