'use client';

import type { ApiMessage } from '@/shared/api/types';
import { FitText } from '@/shared/stage/FitText';
import { SignatureMark } from '@/shared/ui/SignatureMark';

/**
 * Featured message layouts for the wall slideshow.
 *
 * Each design is ONE locked pack: photo + crest + line + panel color + accent.
 * Packs never mix — message N gets pack N % length, then loops.
 */
export type WallDesignId = 'one' | 'two' | 'three' | 'four' | 'five' | 'six';

export type WallDesign = {
    id: WallDesignId;
    photo: string;
    crest: string;
    line: string;
    panel: string;
    accent: string;
    mottoAr: string;
    mottoEn: string;
};

const DESIGNS: Record<WallDesignId, WallDesign> = {
    one: {
        id: 'one',
        photo: '/assets/wall/designs/one/photo.jpg',
        crest: '/assets/wall/designs/one/crest.png',
        line: '/assets/wall/designs/one/line.png',
        panel: '#0a2a22',
        accent: '#4CB944',
        mottoAr: 'عزّنا بأصالتنا',
        mottoEn: 'Our pride is our authenticity',
    },
    two: {
        id: 'two',
        photo: '/assets/wall/designs/two/photo.jpg',
        crest: '/assets/wall/designs/two/crest.png',
        line: '/assets/wall/designs/two/line.png',
        panel: '#0b1f33',
        accent: '#7EB8D8',
        mottoAr: 'عزّنا بضيافتنا',
        mottoEn: 'Our pride is our hospitality',
    },
    three: {
        id: 'three',
        photo: '/assets/wall/designs/three/photo.jpg',
        crest: '/assets/wall/designs/three/crest.png',
        line: '/assets/wall/designs/three/line.png',
        panel: '#1a0a10',
        accent: '#E8A0B8',
        mottoAr: 'عزّنا بتميزنا',
        mottoEn: 'Our pride is our excellence',
    },
    four: {
        id: 'four',
        photo: '/assets/wall/designs/four/photo.jpg',
        crest: '/assets/wall/designs/four/crest.png',
        line: '/assets/wall/designs/four/line.png',
        panel: '#1a1028',
        accent: '#B8A0E8',
        mottoAr: 'عزّنا بتقاليدنا',
        mottoEn: 'Our pride is our traditions',
    },
    five: {
        id: 'five',
        photo: '/assets/wall/designs/five/photo.jpg',
        crest: '/assets/wall/designs/five/crest.png',
        line: '/assets/wall/designs/five/line.png',
        panel: '#0d1f14',
        accent: '#A8C478',
        mottoAr: 'عزّنا بشجاعتنا',
        mottoEn: 'Our pride is our courage',
    },
    six: {
        id: 'six',
        photo: '/assets/wall/designs/six/photo.jpg',
        crest: '/assets/wall/designs/six/crest.png',
        line: '/assets/wall/designs/six/line.png',
        panel: '#0e2a2e',
        accent: '#D4B896',
        mottoAr: 'عزّنا بعلمنا',
        mottoEn: 'Our pride is our knowledge',
    },
};

/** Ordered list — append new design ids here as packs arrive. */
export const WALL_DESIGN_ORDER: WallDesignId[] = ['one', 'two', 'three', 'four', 'five', 'six'];

export function wallDesignForIndex(index: number): WallDesignId {
    const n = WALL_DESIGN_ORDER.length;

    return WALL_DESIGN_ORDER[((index % n) + n) % n] ?? 'one';
}

export function getWallDesign(id: WallDesignId): WallDesign {
    return DESIGNS[id];
}

function DesignLine({ src, className }: { src: string; className?: string }) {
    return (
        <div
            aria-hidden
            className={`h-11 w-full shrink-0 bg-center bg-no-repeat ${className ?? ''}`}
            style={{
                backgroundImage: `url(${src})`,
                backgroundSize: 'contain',
                imageRendering: 'pixelated',
            }}
        />
    );
}

/**
 * Full-stage split: photo edge-to-edge on the left, message panel on the right.
 *
 * Desktop / large screens:
 *   photo + 560px card
 *
 * Mobile:
 *   card only — photo is hidden.
 */
export function FeaturedMessageSlide({
                                         message,
                                         designId = 'one',
                                         className,
                                     }: {
    message: ApiMessage;
    designId?: WallDesignId;
    className?: string;
}) {
    const design = DESIGNS[designId];

    const dir = message.language === 'ar' ? 'rtl' : 'ltr';

    const motto =
        message.language === 'ar'
            ? design.mottoAr
            : design.mottoEn;

    return (
        <div
            className={`absolute inset-0 grid h-full w-full min-h-0 min-w-0 grid-cols-1 grid-rows-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_560px] ${className ?? ''}`}
            style={{
                backgroundColor: design.panel,
            }}
            dir="ltr"
            data-wall-design={design.id}
        >
            <div className="relative hidden h-full min-h-0 min-w-0 overflow-hidden lg:block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    key={design.photo}
                    src={design.photo}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-center"
                />
            </div>

            <aside
                className="relative z-10 flex h-full min-h-0 min-w-0 flex-col items-center justify-between px-[clamp(16px,2.1vw,40px)]"
                style={{
                    backgroundColor: design.panel,
                    paddingTop: 'clamp(24px,6vh,72px)',
                    paddingBottom: 'clamp(24px,6vh,72px)',
                }}
                dir={dir}
            >
                <DesignLine
                    src={design.line}
                    className="opacity-95"
                />

                <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-[clamp(10px,1.3vw,20px)] py-[clamp(8px,1vh,16px)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        key={design.crest}
                        src={design.crest}
                        alt=""
                        className="h-auto w-[clamp(72px,9vw,176px)] max-h-[22%] max-w-full object-contain"
                    />

                    <p
                        className="font-display text-center text-[clamp(20px,1.6vw,30px)] leading-tight"
                        style={{
                            color: design.accent,
                        }}
                    >
                        {motto}
                    </p>

                    <FitText
                        id={`feature-${message.id}-${design.id}`}
                        text={message.message}
                        min={16}
                        max={56}
                        className="mt-2 min-h-0 max-h-[clamp(180px,31.5vh,340px)] w-full min-w-0 text-center leading-relaxed text-sand"
                    />

                    <div className="mt-[clamp(8px,1.5vh,24px)] flex min-w-0 max-w-full flex-col items-center gap-[clamp(4px,0.5vh,8px)]">
                        {message.signature?.svg && (
                            <SignatureMark
                                svg={message.signature.svg}
                                className="h-[clamp(32px,4.5vh,64px)] w-[clamp(80px,13vw,208px)] max-w-full shrink-0 text-sand/85"
                            />
                        )}

                        <p className="user-text max-w-full truncate text-center text-[clamp(12px,1.05vw,20px)] leading-tight text-sand/55">
                            {message.name}
                            {message.department ? ` · ${message.department[message.language === 'ar' ? 'name_ar' : 'name_en']}` : ''}
                        </p>
                    </div>
                </div>

                <DesignLine
                    src={design.line}
                    className="opacity-95"
                />
            </aside>
        </div>
    );
}