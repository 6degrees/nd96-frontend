'use client';

import { useEffect, useRef, type ReactNode } from 'react';

// Wall, timeline and participation view are designed once at 1920×1080 in
// absolute pixels, then scaled to whatever the venue's screen actually is.
// No media queries, no reflow surprises on site (spec §3).
export const STAGE_W = 1920;
export const STAGE_H = 1080;

export function Stage({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const apply = () => {
      const s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
      stage.style.transform = `scale(${s})`;
      stage.style.transformOrigin = 'top left';
      // centre the letterboxed stage
      stage.style.left = `${(window.innerWidth - STAGE_W * s) / 2}px`;
      stage.style.top = `${(window.innerHeight - STAGE_H * s) / 2}px`;
    };

    let timer: ReturnType<typeof setTimeout> | undefined;
    const debounced = () => {
      clearTimeout(timer);
      timer = setTimeout(apply, 150);
    };

    apply();
    window.addEventListener('resize', debounced);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', debounced);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-night">
      <div ref={stageRef} className="absolute" style={{ width: STAGE_W, height: STAGE_H }}>
        {children}
      </div>
    </div>
  );
}
