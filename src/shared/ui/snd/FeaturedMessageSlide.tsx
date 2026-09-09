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
 * Always renders ONE complete design pack — never mix photo/crest/line/colors across packs.
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
  const motto = message.language === 'ar' ? design.mottoAr : design.mottoEn;

  return (
    <div
      className={`absolute inset-0 grid h-full w-full overflow-hidden ${className ?? ''}`}
      style={{
        backgroundColor: design.panel,
        gridTemplateColumns: 'minmax(0, 1fr) 560px',
      }}
      dir="ltr"
      data-wall-design={design.id}
    >
      <div className="relative h-full min-w-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={design.photo}
          src={design.photo}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      </div>

      <aside
        className="relative z-10 flex h-full flex-col items-center justify-between px-10"
        style={{ backgroundColor: design.panel, paddingTop: 72, paddingBottom: 72 }}
        dir={dir}
      >
        <DesignLine src={design.line} className="opacity-95" />

        <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-5 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={design.crest}
            src={design.crest}
            alt=""
            className="h-36 w-36 object-contain lg:h-44 lg:w-44"
          />
          <p className="font-display text-center text-3xl" style={{ color: design.accent }}>
            {motto}
          </p>

          <FitText
            id={`feature-${message.id}-${design.id}`}
            text={message.message}
            min={32}
            max={56}
            className="mt-2 max-h-[340px] w-full text-center leading-relaxed text-sand"
          />

          <div className="mt-6 flex flex-col items-center gap-2">
              <img
                  src={message.signature}
                  alt="Signature"
                  className="h-16 w-52 object-contain brightness-0 invert"
              />
            <p className="user-text text-center text-xl text-sand/55">
              {message.name}
              {message.department ? ` · ${message.department[message.language === 'ar' ? 'name_ar' : 'name_en']}` : ''}
            </p>
          </div>
        </div>

        <DesignLine src={design.line} className="opacity-95" />
      </aside>
    </div>
  );
}
