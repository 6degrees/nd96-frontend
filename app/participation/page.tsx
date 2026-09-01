'use client';

import { useEffect, useRef, useState } from 'react';
import type { Stats } from '@/shared/api/types';
import { useI18n } from '@/shared/i18n';
import { Stage } from '@/shared/stage/Stage';
import { createTransport } from '@/shared/transport';
import { CoBrand, SaduDivider } from '@/shared/ui/Brand';

export default function ParticipationPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    void createTransport().then((transport) => {
      if (cancelled) return;
      unsubscribe = transport.subscribe('participation', {
        'stats.updated': ({ stats: s }) => setStats(s),
      });
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return (
    <Stage>
      <div className="snd-grid flex h-full w-full flex-col items-center justify-center gap-16 bg-night">
        <SaduDivider />
        <div className="flex gap-32">
          {/* Western digits in both languages — brand decision, confirm with SATORP */}
          <Counter value={stats?.messages ?? 0} label={t('participation.messages')} />
          <Counter value={stats?.timelineTaps ?? 0} label={t('participation.taps')} />
        </div>
        <div className="text-center">
          <h2 className="mb-6 text-4xl font-semibold opacity-70">{t('participation.topDepartments')}</h2>
          <ol className="space-y-3 text-3xl">
            {(stats?.topDepartments ?? []).map((d) => (
              <li key={d.name}>
                <span className="font-bold">{d.name}</span>
                <span className="ms-4 opacity-60">
                  <CountUp value={d.count} />
                </span>
              </li>
            ))}
          </ol>
        </div>
        <CoBrand tone="dark" className="text-2xl text-sand" />
      </div>
    </Stage>
  );
}

function Counter({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      {/* SATORP typography gradient: lime -> cyan only (guidelines p63) */}
      <div className="satorp-text-gradient font-display text-[160px] leading-none">
        <CountUp value={value} />
      </div>
      <div className="mt-4 text-4xl text-sand opacity-80">{label}</div>
    </div>
  );
}

// rAF count-up toward the latest value; cheap enough to run all day
function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const target = useRef(value);

  useEffect(() => {
    target.current = value;
    let raf = 0;
    const step = () => {
      setShown((cur) => {
        const diff = target.current - cur;
        if (diff === 0) return cur;
        return cur + Math.ceil(diff / 8) * Math.sign(diff);
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{shown.toLocaleString('en-US')}</>;
}
