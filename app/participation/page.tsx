'use client';

import { useEffect, useRef, useState } from 'react';
import type { Stats } from '@/shared/api/types';
import { useI18n } from '@/shared/i18n';
import { Stage } from '@/shared/stage/Stage';
import { createTransport } from '@/shared/transport';
import { CoBrand, SatorpRule } from '@/shared/ui/Brand';
import { SaduSleepingLine, SndPatternFrame, WaveOverlay } from '@/shared/ui/snd/Decor';
import { WallFillBackdrop } from '@/shared/ui/snd/WallFillBackdrop';

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

  const messages = stats?.messages ?? 0;
  const departments = stats?.topDepartments ?? [];
  const topCount = departments[0]?.count ?? 1;

  return (
    <Stage>
      <div className="relative h-full w-full bg-night">
        <WallFillBackdrop count={messages} />
        <SndPatternFrame className="relative z-10 flex h-full w-full flex-col bg-transparent p-10" side={false}>
          <WaveOverlay className="pointer-events-none opacity-50" />

          <header className="relative z-10 mb-6 flex items-end justify-between gap-8">
            <div>
              <h1 className="font-display text-5xl text-sand">{t('participation.title')}</h1>
              <p className="mt-1 text-2xl text-sand/60">{t('participation.subtitle')}</p>
            </div>
            <CoBrand tone="dark" className="mb-1 shrink-0 text-xl text-sand" />
          </header>

          <SatorpRule className="relative z-10 mb-6" />
          <SaduSleepingLine className="relative z-10 mx-auto mb-10 w-full max-w-3xl" />

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-14">
            <div className="flex w-full max-w-4xl flex-wrap items-stretch justify-center gap-8 lg:gap-16">
              <StatCard value={messages} label={t('participation.messages')} accent="saudi" />
              <StatCard value={stats?.timelineTaps ?? 0} label={t('participation.taps')} accent="satorp" />
            </div>

            {departments.length > 0 && (
              <section className="w-full max-w-2xl rounded-3xl border border-white/10 bg-night/50 p-8 backdrop-blur-sm">
                <h2 className="mb-8 text-center font-display text-3xl text-sand/80">{t('participation.topDepartments')}</h2>
                <ol className="space-y-5">
                  {departments.map((d, i) => (
                    <li key={d.name} className="flex items-start gap-4">
                      <span className="mt-1 w-8 shrink-0 font-mono text-lg text-snd-bright/70">{String(i + 1).padStart(2, '0')}</span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-baseline justify-between gap-4">
                          <span className="font-display text-2xl text-sand">{d.name}</span>
                          <span className="font-mono text-xl text-sand/50">
                            <CountUp value={d.count} />
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-saudi to-snd-bright transition-[width] duration-700 ease-out"
                            style={{ width: `${Math.max(8, (d.count / topCount) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        </SndPatternFrame>
      </div>
    </Stage>
  );
}

function StatCard({ value, label, accent }: { value: number; label: string; accent: 'saudi' | 'satorp' }) {
  return (
    <div className="flex min-w-[280px] flex-1 flex-col items-center rounded-3xl border border-white/10 bg-white/[0.06] px-10 py-12 text-center shadow-[0_12px_48px_rgba(0,0,0,0.25)] backdrop-blur-sm">
      <div
        className={`font-display text-[clamp(5rem,14vw,9rem)] leading-none ${accent === 'satorp' ? 'satorp-text-gradient' : 'text-saudi'}`}
      >
        <CountUp value={value} />
      </div>
      <p className="mt-5 font-display text-3xl text-sand/85">{label}</p>
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
        return cur + Math.ceil(Math.abs(diff) / 8) * Math.sign(diff);
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{shown.toLocaleString('en-US')}</>;
}
