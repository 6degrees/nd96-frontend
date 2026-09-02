'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import SignaturePad from 'signature_pad';

// signature_pad wrapper with the three traps handled (spec §3):
// - retina scaling, or the stroke is soft and offset
// - touch-action: none, or iOS scrolls the page instead of drawing
// - on resize/rotate, re-size then restore, or the signature vanishes

export interface SignatureHandle {
  isEmpty: () => boolean;
  pointCount: () => number;
  toSVG: () => string;
  toPNG: () => string;
  clear: () => void;
}

export const SignatureField = forwardRef<SignatureHandle, { className?: string }>(
  function SignatureField({ className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const padRef = useRef<SignaturePad | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const pad = new SignaturePad(canvas, { minWidth: 1.2, maxWidth: 3.2, throttle: 8 });
      padRef.current = pad;

      const resize = () => {
        const data = pad.toData();
        const ratio = window.devicePixelRatio || 1;
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext('2d')?.scale(ratio, ratio);
        pad.fromData(data);
      };

      resize();
      window.addEventListener('resize', resize);
      window.addEventListener('orientationchange', resize);
      return () => {
        window.removeEventListener('resize', resize);
        window.removeEventListener('orientationchange', resize);
        pad.off();
        padRef.current = null;
      };
    }, []);

    useImperativeHandle(ref, () => ({
      isEmpty: () => padRef.current?.isEmpty() ?? true,
      pointCount: () => padRef.current?.toData().reduce((n, stroke) => n + stroke.points.length, 0) ?? 0,
      toSVG: () => padRef.current?.toSVG() ?? '',
      toPNG: () => padRef.current?.toDataURL('image/png') ?? '',
      clear: () => padRef.current?.clear(),
    }));

    return (
      <canvas
        ref={canvasRef}
        className={`h-44 w-full rounded-xl border-2 border-dashed border-snd-night/20 bg-white shadow-inner transition focus-within:border-saudi focus-within:border-solid ${className ?? ''}`}
        style={{ touchAction: 'none' }}
      />
    );
  },
);
