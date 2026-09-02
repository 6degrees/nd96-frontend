'use client';

import Image from 'next/image';

// Co-brand lockup + sadu ornaments.
//
// SND + SATORP logos in public/brand/ (swap for SVG when exported from Illustrator).
// Co-branding rule (SATORP guidelines p2/p42): SATORP sits LEFT in Arabic contexts (dir=ltr).

const SND_LOGO = '/brand/snd-logo.png';
const SATORP_LOGO = '/brand/satorp-logo.svg';
const SATORP_LOGO_WHITE = '/brand/satorp-logo-white.png';

export function SndLogo({ className, height = 56 }: { className?: string; height?: number }) {
  return (
    <Image
      src={SND_LOGO}
      alt="عزّنا بطبعنا — Saudi National Day 96"
      width={Math.round(height * 4.2)}
      height={height}
      className={`block object-contain ${className ?? ''}`}
      style={{ height, width: 'auto' }}
      priority
    />
  );
}

export function SatorpLogo({
  className,
  height = 40,
  tone = 'light',
}: {
  className?: string;
  height?: number;
  tone?: 'light' | 'dark';
}) {
  const src = tone === 'dark' ? SATORP_LOGO_WHITE : SATORP_LOGO;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="SATORP — ساتورب"
      height={height}
      className={`block object-contain ${tone === 'dark' ? 'mix-blend-screen' : ''} ${className ?? ''}`}
      style={{ height, width: 'auto' }}
    />
  );
}

export function CoBrand({
  tone = 'light',
  className,
  divider = true,
  logoHeight,
}: {
  tone?: 'light' | 'dark';
  className?: string;
  divider?: boolean;
  logoHeight?: number;
}) {
  const muted = tone === 'light' ? 'opacity-30' : 'opacity-40';
  const height = logoHeight ?? (tone === 'dark' ? 44 : 40);

  return (
    <div className={`mx-auto flex w-fit items-center gap-3 sm:gap-4 ${className ?? ''}`} dir="ltr">
      <SatorpLogo height={height} tone={tone} />
      {divider && <span aria-hidden className={`h-6 w-px shrink-0 bg-current ${muted}`} />}
      <SndLogo height={height} className={tone === 'light' ? 'opacity-95' : undefined} />
    </div>
  );
}

// Row of sadu diamonds — the pixel ornament rows from the SND guideline.
export function SaduDivider({ className }: { className?: string }) {
  const diamonds = Array.from({ length: 12 });
  return (
    <div aria-hidden className={`flex items-center justify-center gap-6 ${className ?? ''}`}>
      {diamonds.map((_, i) => (
        <svg key={i} width="10" height="10" viewBox="0 0 10 10" className="shrink-0">
          <rect x="5" y="-2" width="7" height="7" transform="rotate(45 5 5)" fill={i % 4 === 2 ? '#4CB944' : '#0E8A46'} />
        </svg>
      ))}
    </div>
  );
}

// SATORP element gradient rule — lime -> green -> cyan (guidelines p62).
export function SatorpRule({ className }: { className?: string }) {
  return <div aria-hidden className={`satorp-line-gradient h-[3px] w-full rounded-full ${className ?? ''}`} />;
}
