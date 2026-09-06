'use client';

import { WALL_FILL_TARGET } from '@/shared/ui/snd/WallFillBackdrop';

const COLS = 24;
const ROWS = 14;
const TOTAL = COLS * ROWS;

export function pixelRevealLit(count: number, target = WALL_FILL_TARGET): number {
  if (count <= 0) return 0;
  return Math.min(TOTAL, Math.floor(Math.min(1, count / target) * TOTAL + 1e-6));
}

/** LCG shuffle — stable across renders so lit tiles don’t flicker. */
function shuffleInPlace(arr: number[], seed: number): number[] {
  let s = seed >>> 0;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

/**
 * Reveal order mixes pockets: center-bottom, sides, top, then the rest —
 * each pocket shuffled, then round-robin so tiles pop from different places.
 * REVEAL_STEP[tileIndex] = when that tile lights (0 = first).
 */
function buildRevealSteps(): number[] {
  const all = Array.from({ length: TOTAL }, (_, i) => i);
  const cx = (COLS - 1) / 2;

  const take = (pred: (col: number, row: number) => boolean, seed: number) => {
    const bag = all.filter((i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      return pred(col, row);
    });
    return shuffleInPlace(bag, seed);
  };

  const pockets = [
    // Center-bottom bloom
    take((c, r) => r >= ROWS * 0.45 && Math.abs(c - cx) <= COLS * 0.28, 2026),
    // Left side
    take((c, r) => c < COLS * 0.28, 96),
    // Right side
    take((c, r) => c > COLS * 0.72, 23),
    // Upper band
    take((c, r) => r < ROWS * 0.35, 1448),
  ];

  const claimed = new Set(pockets.flat());
  const leftovers = shuffleInPlace(
    all.filter((i) => !claimed.has(i)),
    7781,
  );
  pockets.push(leftovers);

  const used = new Set<number>();
  const order: number[] = [];
  let guard = 0;
  while (order.length < TOTAL && guard < TOTAL * 4) {
    guard += 1;
    let progressed = false;
    for (const pocket of pockets) {
      while (pocket.length > 0) {
        const next = pocket.shift()!;
        if (used.has(next)) continue;
        used.add(next);
        order.push(next);
        progressed = true;
        break; // round-robin: one from this pocket, then next pocket
      }
    }
    if (!progressed) break;
  }

  // Any misses (shouldn't happen) — append remaining
  for (let i = 0; i < TOTAL; i++) {
    if (!used.has(i)) order.push(i);
  }

  const stepOf = new Array<number>(TOTAL);
  order.forEach((tile, step) => {
    stepOf[tile] = step;
  });
  return stepOf;
}

const REVEAL_STEP = buildRevealSteps();

/**
 * Home hero photo behind the wall — fills tile-by-tile in a mixed random order
 * (center-bottom, sides, top…) as published messages approach the fill target.
 */
export function PixelRevealBackdrop({
  count,
  target = WALL_FILL_TARGET,
  src = '/assets/home/hero-backdrop.png',
  className,
}: {
  count: number;
  target?: number;
  src?: string;
  className?: string;
}) {
  const lit = pixelRevealLit(count, target);
  const progress = Math.min(1, count / Math.max(1, target));

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className ?? ''}`}
    >
      <div className="absolute inset-0 bg-night" />

      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        }}
      >
        {Array.from({ length: TOTAL }, (_, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const step = REVEAL_STEP[i] ?? i;
          const on = step < lit;
          const x = COLS === 1 ? 0 : (col / (COLS - 1)) * 100;
          const y = ROWS === 1 ? 0 : (row / (ROWS - 1)) * 100;

          return (
            <div
              key={i}
              className="relative overflow-hidden transition-opacity duration-500 ease-out"
              style={{
                opacity: on ? 1 : 0,
                transitionDelay: on ? `${(step % 7) * 20}ms` : '0ms',
              }}
            >
              <div
                className="absolute inset-0 scale-105 bg-cover bg-center blur-[1.5px] brightness-[0.5] saturate-[0.85]"
                style={{
                  backgroundImage: `url(${src})`,
                  backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
                  backgroundPosition: `${x}% ${y}%`,
                }}
              />
            </div>
          );
        })}
      </div>

      <div
        className="absolute inset-0 bg-night transition-opacity duration-700 ease-out"
        style={{ opacity: 0.72 - progress * 0.38 }}
      />
      <div className="snd-grid absolute inset-0 opacity-30" />
    </div>
  );
}
