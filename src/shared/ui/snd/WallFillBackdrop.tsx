'use client';

// Wall backdrop brightens as participation grows — 0 messages = invisible,
// 100 messages = full brightness. Swap the image in public/assets/wall/backdrop.jpg.

export const WALL_FILL_TARGET = 100;

export function wallFillOpacity(count: number, target = WALL_FILL_TARGET): number {
  if (count <= 0) return 0;
  return Math.min(1, count / target);
}

export function WallFillBackdrop({ count, target = WALL_FILL_TARGET }: { count: number; target?: number }) {
  const opacity = wallFillOpacity(count, target);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/wall/backdrop.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[2500ms] ease-out"
        style={{ opacity }}
      />
      {/* Keep cards readable even at full fill */}
      <div
        className="absolute inset-0 bg-night transition-opacity duration-[2500ms] ease-out"
        style={{ opacity: 0.55 - opacity * 0.25 }}
      />
    </div>
  );
}
