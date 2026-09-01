'use client';

import { useLayoutEffect, useRef } from 'react';

// Binary-search font size until the text fits its box; cache per message id.
// Message lengths vary too much for a fixed size (spec §6).
const cache = new Map<string, number>();

export function fitFontSize(cacheKey: string, el: HTMLElement, min = 28, max = 72): number {
  const cached = cache.get(cacheKey);
  if (cached !== undefined) return cached;

  let lo = min;
  let hi = max;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    el.style.fontSize = `${mid}px`;
    if (el.scrollHeight <= el.clientHeight) lo = mid;
    else hi = mid - 1;
  }
  cache.set(cacheKey, lo);
  return lo;
}

interface FitTextProps {
  id: string;
  text: string;
  min?: number;
  max?: number;
  className?: string;
}

export function FitText({ id, text, min = 28, max = 72, className }: FitTextProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.fontSize = `${fitFontSize(id, el, min, max)}px`;
  }, [id, text, min, max]);

  // user-text: unicode-bidi plaintext so mixed Arabic/Latin renders correctly
  return (
    <div ref={ref} className={`user-text overflow-hidden ${className ?? ''}`}>
      {text}
    </div>
  );
}
