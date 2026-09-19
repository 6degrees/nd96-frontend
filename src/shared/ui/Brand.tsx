'use client';

import Image from 'next/image';

// Co-brand lockup + sadu ornaments.
//
// SND + SATORP logos in public/brand/.
// Lockup: SND (smaller) on the left, SATORP on the right.

const SND_LOGO = '/brand/snd-logo.png';
const SATORP_LOGO = '/brand/satorp-logo.svg';
const SATORP_LOGO_WHITE = '/brand/satorp-logo-white.png';

export function SndLogo({
                            className,
                            height = 56,
                        }: {
    className?: string;
    height?: number;
}) {
    return (
        <Image
            src={SND_LOGO}
            alt="عزّنا بطبعنا — Saudi National Day 96"
            width={Math.round(height * 4.2)}
            height={height}
            className={`block h-auto max-h-[clamp(1.75rem,min(4vw,7vh),4.5rem)] w-auto max-w-full object-contain ${className ?? ''}`}
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
            className={`block h-auto max-h-[clamp(1.75rem,min(4vw,7vh),4.5rem)] w-auto max-w-full object-contain ${
                tone === 'dark' ? 'mix-blend-screen' : ''
            } ${className ?? ''}`}
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
    const satorpHeight = logoHeight ?? (tone === 'dark' ? 44 : 40);
    const sndHeight = Math.round(satorpHeight * 0.72);

    return (
        <div
            className={`mx-auto flex w-fit max-w-full items-center justify-center gap-[clamp(0.5rem,min(1vw,2vh),1rem)] ${className ?? ''}`}
            dir="ltr"
        >
            <SndLogo
                height={sndHeight}
                className={tone === 'light' ? 'opacity-95' : undefined}
            />

            {divider && (
                <span
                    aria-hidden
                    className={`h-[clamp(1.25rem,min(3vw,5vh),2rem)] w-px shrink-0 bg-current ${muted}`}
                />
            )}

            <SatorpLogo
                height={satorpHeight}
                tone={tone}
            />
        </div>
    );
}

// Row of sadu diamonds — the pixel ornament rows from the SND guideline.
export function SaduDivider({
                                className,
                            }: {
    className?: string;
}) {
    const diamonds = Array.from({ length: 12 });

    return (
        <div
            aria-hidden
            className={`flex items-center justify-center gap-[clamp(0.5rem,min(1.5vw,3vh),1.5rem)] ${className ?? ''}`}
        >
            {diamonds.map((_, i) => (
                <svg
                    key={i}
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    className="h-[clamp(0.35rem,min(0.6vw,1.2vh),0.625rem)] w-[clamp(0.35rem,min(0.6vw,1.2vh),0.625rem)] shrink-0"
                >
                    <rect
                        x="5"
                        y="-2"
                        width="7"
                        height="7"
                        transform="rotate(45 5 5)"
                        fill={i % 4 === 2 ? '#4CB944' : '#0E8A46'}
                    />
                </svg>
            ))}
        </div>
    );
}

// SATORP element gradient rule — lime -> green -> cyan.
export function SatorpRule({
                               className,
                           }: {
    className?: string;
}) {
    return (
        <div
            aria-hidden
            className={`satorp-line-gradient h-[clamp(2px,min(0.2vw,0.4vh),4px)] w-full rounded-full ${className ?? ''}`}
        />
    );
}