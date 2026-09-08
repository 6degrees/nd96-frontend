'use client';

import { useEffect, useRef, type ReactNode } from 'react';

// Designed once at 1920×1080, then scaled to the venue screen.
// - contain: whole stage visible (letterbox ok) — timeline / participation
// - cover: fills viewport (may crop edges) — wall featured full-bleed
export const STAGE_W = 1920;
export const STAGE_H = 1080;

export function Stage({
  children,
  fit = 'contain',
}: {
  children: ReactNode;
  fit?: 'contain' | 'cover';
}) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const apply = () => {
      const sW = window.innerWidth / STAGE_W;
      const sH = window.innerHeight / STAGE_H;
      // cover may only crop marginally (≤5%) — a laptop (16:10) or portrait
      // window letterboxes instead of slicing message text off the edges.
      // On the venue's exact 16:9 screen, cover and contain are identical.
      const contain = Math.min(sW, sH);
      const cover = Math.max(sW, sH);
      const s = fit === 'cover' && cover / contain <= 1.05 ? cover : contain;
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
  }, [fit]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-night">
      <div ref={stageRef} className="absolute" style={{ width: STAGE_W, height: STAGE_H }}>
        {children}
      </div>
    </div>
  );
}
