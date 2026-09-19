'use client';

import { useEffect, useState, type ReactNode } from 'react';

// Presentation-deck ornaments — Sadu weave, wave ground.
// Pure SVG/CSS; swap in official brand assets from public/brand/ when they arrive.

export function SaduBand({ className }: { className?: string }) {
    return (
        <div
            aria-hidden
            className={`snd-sadu-band h-[clamp(0.25rem,min(0.4vw,0.8vh),0.75rem)] w-full ${className ?? ''}`}
        />
    );
}

/** Horizontal Sadu motif strip — official multi-motif guideline asset. */
export function SaduSleepingLine({ className }: { className?: string }) {
    return (
        <div
            aria-hidden
            className={`snd-pattern-sleeping-line h-[clamp(1rem,min(1.5vw,3vh),2rem)] w-full ${className ?? ''}`}
        />
    );
}

export function WaveOverlay({ className }: { className?: string }) {
    return (
        <div
            aria-hidden
            className={`snd-wave pointer-events-none absolute inset-0 ${className ?? ''}`}
        />
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
        <div
            aria-hidden
            className={`flex items-center justify-center gap-[clamp(0.35rem,min(0.7vw,1.5vh),0.75rem)] ${className ?? ''}`}
        >
            {[0, 1, 2].map((i) => (
                <svg
                    key={i}
                    width="14"
                    height="12"
                    viewBox="0 0 14 12"
                    className="h-[clamp(0.5rem,min(0.8vw,1.5vh),0.75rem)] w-[clamp(0.6rem,min(0.9vw,1.7vh),0.875rem)] shrink-0"
                >
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
        <div
            className={`flex w-full max-w-[min(90vw,120rem)] flex-col items-center gap-[clamp(0.75rem,min(2vh,2vw),1.5rem)] ${className ?? ''}`}
        >
            <MotifTriple />

            <div className="flex w-full min-w-0 items-center gap-[clamp(0.75rem,min(2vw,3vh),2rem)]">
                <div
                    aria-hidden
                    className="snd-pattern-sleeping-line h-[clamp(0.75rem,min(1vw,2vh),1.5rem)] min-w-0 flex-1"
                />

                <h2 className="max-w-[85%] shrink font-display text-center text-[clamp(1.5rem,min(4vw,7vh),4.5rem)] leading-[1.1] text-sand">
                    {title}
                </h2>

                <div
                    aria-hidden
                    className="snd-pattern-sleeping-line h-[clamp(0.75rem,min(1vw,2vh),1.5rem)] min-w-0 flex-1 scale-x-[-1]"
                />
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
        <div className={`relative min-h-0 min-w-0 ${className ?? ''}`}>
            {purpleAccent && (
                <div
                    aria-hidden
                    className="snd-pattern-purple pointer-events-none absolute end-[clamp(0.5rem,min(2vw,2vh),2rem)] top-[clamp(0.5rem,min(2vh,2vw),2rem)] z-[1] h-[clamp(6rem,min(15vw,30vh),16rem)] w-[clamp(6rem,min(15vw,30vh),16rem)]"
                />
            )}

            {side && !bothSides && (
                <div
                    aria-hidden
                    className="snd-pattern-side pointer-events-none absolute bottom-0 end-0 top-0 z-[1]"
                />
            )}

            {side && bothSides && (
                <>
                    <div
                        aria-hidden
                        className="snd-pattern-side snd-pattern-side--left pointer-events-none absolute bottom-0 start-0 top-0 z-[1]"
                    />

                    <div
                        aria-hidden
                        className="snd-pattern-side snd-pattern-side--right pointer-events-none absolute bottom-0 end-0 top-0 z-[1]"
                    />
                </>
            )}

            {bottom && (
                <div
                    aria-hidden
                    className="snd-pattern-bottom pointer-events-none absolute inset-x-0 bottom-0 z-[1]"
                />
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
            <h1 className="font-display text-[clamp(1.5rem,min(3.5vw,6vh),3.75rem)] leading-tight text-sand">
                {title}
            </h1>

            {subtitle && (
                <p className="mt-[clamp(0.25rem,min(0.5vh,0.5vw),0.75rem)] text-[clamp(0.875rem,min(1.5vw,3vh),1.5rem)] leading-relaxed text-sand/60">
                    {subtitle}
                </p>
            )}

            <div className="satorp-line-gradient mt-[clamp(0.5rem,min(1vh,1vw),1rem)] h-[clamp(2px,min(0.2vw,0.4vh),4px)] max-w-[min(50vw,32rem)] rounded-full" />
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
            className={`min-h-[clamp(3.5rem,min(7vw,8vh),5.5rem)] min-w-[clamp(7rem,min(12vw,18vh),10rem)] shrink-0 rounded-[clamp(0.75rem,min(1.5vw,2vh),1.5rem)] border px-[clamp(0.5rem,min(1vw,2vh),1rem)] py-[clamp(0.5rem,min(1vh,1vw),0.75rem)] text-center text-[clamp(0.9rem,min(1.5vw,3vh),1.5rem)] font-semibold transition-all duration-200 ${
                active
                    ? 'border-saudi/60 bg-saudi text-white shadow-[0_0_32px_rgba(14,138,70,0.35)]'
                    : 'border-white/10 bg-white/5 text-sand/90 hover:bg-white/10'
            } ${className ?? ''}`}
        >
            <span className="block leading-tight">{name}</span>

            <span
                className={`mt-1 block text-[clamp(0.7rem,min(1vw,2vh),1.125rem)] ${
                    active ? 'text-white/80' : 'text-sand/50'
                }`}
            >
                {range}
            </span>
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
            className={`min-h-[clamp(3.5rem,min(7vw,8vh),5rem)] min-w-[clamp(8rem,min(14vw,22vh),14rem)] max-w-[clamp(12rem,min(22vw,32vh),20rem)] rounded-[clamp(0.75rem,min(1.5vw,2vh),1.5rem)] border px-[clamp(0.75rem,min(1.5vw,2vh),1.25rem)] py-[clamp(0.5rem,min(1vh,1vw),0.75rem)] text-center transition-colors ${
                active
                    ? 'border-sand/40 bg-sand text-night shadow-lg'
                    : 'border-white/10 bg-white/5 text-sand hover:bg-white/10'
            }`}
        >
            <span className="block text-[clamp(1rem,min(2vw,4vh),1.5rem)] font-semibold leading-tight">
                {label}
            </span>

            {sublabel && (
                <span
                    className={`mt-1 block truncate text-[clamp(0.7rem,min(1vw,2vh),1rem)] leading-snug ${
                        active ? 'text-night/65' : 'text-sand/50'
                    }`}
                >
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
                                  fill = false,
                              }: {
    src: string;
    title: string;
    placeholder: string;
    /** fill the parent instead of the fixed 700×520 card */
    fill?: boolean;
}) {
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setFailed(false);
    }, [src]);

    return (
        <div
            className={`relative overflow-hidden bg-snd-grid/80 ${
                fill
                    ? 'h-full min-h-0 w-full'
                    : 'aspect-[700/520] h-auto w-full max-w-[min(90vw,43.75rem)] shrink-0 rounded-[clamp(1rem,min(2vw,3vh),1.5rem)] border border-saudi/25 shadow-[0_24px_80px_rgba(0,0,0,0.45)]'
            }`}
        >
            <div
                aria-hidden
                className="snd-pattern-sleeping-line absolute inset-x-0 top-0 z-10 h-[clamp(2px,min(0.35vw,0.7vh),0.5rem)] opacity-90"
            />

            <div
                aria-hidden
                className="snd-pattern-sleeping-line absolute inset-x-0 bottom-0 z-10 h-[clamp(2px,min(0.35vw,0.7vh),0.5rem)] opacity-90"
            />

            {failed ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-[clamp(0.75rem,min(1.5vw,2vh),1rem)] bg-gradient-to-b from-snd-grid to-night px-[clamp(1rem,min(3vw,5vh),2rem)]">
                    <svg
                        aria-hidden
                        width="56"
                        height="56"
                        viewBox="0 0 56 56"
                        fill="none"
                        className="h-[clamp(2.5rem,min(5vw,10vh),3.5rem)] w-[clamp(2.5rem,min(5vw,10vh),3.5rem)] text-sand/25"
                    >
                        <rect
                            x="6"
                            y="10"
                            width="44"
                            height="36"
                            rx="4"
                            stroke="currentColor"
                            strokeWidth="2"
                        />
                        <circle
                            cx="20"
                            cy="24"
                            r="4"
                            stroke="currentColor"
                            strokeWidth="2"
                        />
                        <path
                            d="M6 38l14-12 10 8 8-6 12 10"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>

                    <p className="font-display text-center text-[clamp(1rem,min(2vw,4vh),1.5rem)] text-sand/45">
                        {placeholder}
                    </p>
                </div>
            ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                    src={src}
                    alt=""
                    className="block h-full w-full object-cover"
                    onError={() => setFailed(true)}
                />
            )}

            {!failed && !fill && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/90 to-transparent px-[clamp(1rem,min(2vw,4vh),1.5rem)] pb-[clamp(1rem,min(2vh,4vw),1.5rem)] pt-[clamp(3rem,min(6vh,8vw),4rem)]">
                    <p className="font-display text-[clamp(1rem,min(2vw,4vh),1.5rem)] text-sand/80">
                        {title}
                    </p>
                </div>
            )}
        </div>
    );
}