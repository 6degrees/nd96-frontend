'use client';

import { useEffect, useRef, useState } from 'react';

const FLIP_MS = 480;

function padDigits(value: number, length: number): string[] {
  const n = Math.max(0, Math.floor(value));
  return String(n).padStart(length, '0').slice(-length).split('');
}

function FlipDigit({ digit }: { digit: string }) {
  const [display, setDisplay] = useState(digit);
  const [from, setFrom] = useState(digit);
  const [flipping, setFlipping] = useState(false);
  const displayRef = useRef(digit);
  const busyRef = useRef(false);
  const queueRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    displayRef.current = display;
  }, [display]);

  useEffect(() => {
    const run = (next: string) => {
      if (next === displayRef.current) {
        busyRef.current = false;
        const queued = queueRef.current;
        queueRef.current = null;
        if (queued !== null && queued !== displayRef.current) run(queued);
        return;
      }

      busyRef.current = true;
      setFrom(displayRef.current);
      setDisplay(next);
      setFlipping(true);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setFlipping(false);
        busyRef.current = false;
        timerRef.current = null;
        const queued = queueRef.current;
        queueRef.current = null;
        if (queued !== null && queued !== displayRef.current) run(queued);
      }, FLIP_MS);
    };

    if (digit === displayRef.current && !busyRef.current) return;

    if (busyRef.current) {
      queueRef.current = digit;
      return;
    }

    run(digit);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [digit]);

  const topChar = flipping ? from : display;
  const bottomChar = display;

  return (
    <div className={`snd-flip${flipping ? ' is-flipping' : ''}`} aria-hidden>
      <div className="snd-flip__static snd-flip__static--top">
        <span>{topChar}</span>
      </div>
      <div className="snd-flip__static snd-flip__static--bottom">
        <span>{bottomChar}</span>
      </div>

      {flipping && (
        <>
          <div className="snd-flip__anim snd-flip__anim--top">
            <span>{from}</span>
          </div>
          <div className="snd-flip__anim snd-flip__anim--bottom">
            <span>{display}</span>
          </div>
        </>
      )}

      <i className="snd-flip__hinge snd-flip__hinge--start" />
      <i className="snd-flip__hinge snd-flip__hinge--end" />
    </div>
  );
}

/**
 * Split-flap message counter — SND night/sand/bright flipper.
 * Digits are always LTR so RTL page dir cannot scramble the value.
 */
export function FlipCounter({
  value,
  digits = 3,
  label = 'Messages · رسائل',
  className,
}: {
  value: number;
  digits?: number;
  label?: string;
  className?: string;
}) {
  const chars = padDigits(value, digits);

  return (
    <div
      className={`flex flex-col items-center gap-2 ${className ?? ''}`}
      role="status"
      aria-live="polite"
      aria-label={`${value} messages`}
    >
      <div className="snd-flip-bank" dir="ltr">
        {chars.map((d, i) => (
          <FlipDigit key={i} digit={d} />
        ))}
      </div>
      <p
        key={label}
        className="font-display max-w-[16rem] text-center text-xs leading-snug tracking-wide text-sand/70 transition-opacity duration-300"
      >
        {label}
      </p>
    </div>
  );
}
