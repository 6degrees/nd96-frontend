'use client';

import { useEffect, useRef, useState } from 'react';
import { FlipCounter } from '@/shared/ui/snd/FlipCounter';
import { WALL_FILL_TARGET } from '@/shared/ui/snd/WallFillBackdrop';

export const MONUMENT_FILL_TARGET = WALL_FILL_TARGET; // 100
/** Discrete pixel rows that light up as messages arrive (snaps like pixels). */
const PIXEL_BANDS = 20;

export function monumentProgress(count: number, target = MONUMENT_FILL_TARGET): number {
  if (count <= 0) return 0;
  return Math.min(1, count / target);
}

/** How many pixel bands are lit (0…PIXEL_BANDS), stepped — not a smooth wash. */
export function monumentPixelBands(count: number, target = MONUMENT_FILL_TARGET): number {
  return Math.min(PIXEL_BANDS, Math.floor(monumentProgress(count, target) * PIXEL_BANDS + 1e-6));
}

/**
 * Tiny Sadu monument above the flip counter.
 * Empty silhouette stays visible; color pixels fill bottom→top with message count.
 */
export function MonumentProgress({
  count,
  target = MONUMENT_FILL_TARGET,
  className,
}: {
  count: number;
  target?: number;
  className?: string;
}) {
  const progress = monumentProgress(count, target);
  const bands = monumentPixelBands(count, target);
  // Clip from the top so unfilled rows stay empty; filled rise from the base
  const clipTopPct = ((PIXEL_BANDS - bands) / PIXEL_BANDS) * 100;
  const [pulse, setPulse] = useState(false);
  const lastBands = useRef(-1);

  const glow = 4 + progress * 26;

  useEffect(() => {
    if (bands > lastBands.current && bands > 0) {
      lastBands.current = bands;
      setPulse(true);
      const id = window.setTimeout(() => setPulse(false), 700);
      return () => window.clearTimeout(id);
    }
    if (bands < lastBands.current) lastBands.current = bands;
  }, [bands]);

  return (
    <div
      className={`pointer-events-none flex flex-col items-center gap-1.5 ${className ?? ''}`}
      role="img"
      aria-label={`${count} of ${target} messages`}
    >
      <div
        className="relative w-14 shrink-0 transition-transform duration-500 ease-out"
        style={{
          transform: pulse ? 'scale(1.1)' : 'scale(1)',
          filter: `drop-shadow(0 0 ${glow}px rgba(76, 185, 68, ${0.1 + progress * 0.5}))`,
        }}
      >
        {/* Empty pixel shell — always readable when unfilled */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/wall/monument.png"
          alt=""
          className="block h-auto w-full select-none opacity-[0.22] brightness-[0.45] saturate-50 [image-rendering:pixelated] mix-blend-screen"
          draggable={false}
        />

        {/* Color pixels fill in row-by-row from the base */}
        <div
          className="absolute inset-0 transition-[clip-path] duration-700 ease-out"
          style={{
            clipPath: `inset(${clipTopPct}% 0 0 0)`,
            willChange: 'clip-path',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/wall/monument.png"
            alt=""
            className="block h-auto w-full select-none [image-rendering:pixelated] mix-blend-screen"
            draggable={false}
          />
        </div>
      </div>

      <FlipCounter
        value={count}
        digits={3}
        label={progress >= 1 ? 'Complete · اكتمل' : 'Messages · رسائل'}
      />
    </div>
  );
}
