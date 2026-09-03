'use client';

import { useEffect, useRef, type ReactNode } from 'react';

// Wall, timeline and participation view are designed once at 1920×1080 in
// absolute pixels, then scaled to cover the venue screen (no letterbox bars).
// Tall screens may crop a little top/bottom (spec §3).
export const STAGE_W = 1920;
export const STAGE_H = 1080;

export function Stage({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const apply = () => {
      // Cover the viewport — no letterbox bars. Tall screens may crop top/bottom.
      const s = Math.max(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
      stage.style.transform = `scale(${s})`;
      stage.style.transformOrigin = 'top left';
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
