'use client';

// Co-brand lockup + sadu ornaments.
//
// TEXT PLACEHOLDERS ONLY: the official SATORP logo and the SND 96 logo
// (عزّنا بطبعنا checkered box) must be dropped into public/brand/ as SVGs and
// swapped in here. Co-branding rule (SATORP guidelines p2/p42): primary SATORP
// logo, gap equal to the 'sa' width; SATORP logo sits LEFT in Arabic contexts.

export function CoBrand({ tone = 'light', className }: { tone?: 'light' | 'dark'; className?: string }) {
  const muted = tone === 'light' ? 'opacity-60' : 'opacity-50';
  return (
    <div className={`flex items-center gap-4 text-sm ${className ?? ''}`} dir="ltr">
      <span className="font-display tracking-wide">
        ساتورب <span className="font-bold">satorp</span>
      </span>
      <span aria-hidden className={`h-6 w-px bg-current ${muted}`} />
      <span className={muted}>
        اليوم الوطني السعودي ٩٦ · Saudi National Day 96
      </span>
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
