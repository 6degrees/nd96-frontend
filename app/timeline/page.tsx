'use client';

import { useCallback, useEffect, useState } from 'react';
import { create } from 'zustand';
import { api } from '@/shared/api/client';
import { TimelineSchema, type TimelineDoc } from '@/shared/api/types';
import { useI18n } from '@/shared/i18n';
import { Stage } from '@/shared/stage/Stage';
import { CoBrand, SndLogo } from '@/shared/ui/Brand';
import { MilestoneChip, ReignTab, SaduSleepingLine, SndPatternFrame, SndTitleBlock, TimelineMedia, WaveOverlay } from '@/shared/ui/snd/Decor';

const CACHE_KEY = 'nd96.timeline';
const IDLE_MS = 90_000;

interface TimelineNav {
  reignIndex: number;
  milestoneIndex: number;
  attract: boolean;
  set: (patch: Partial<Omit<TimelineNav, 'set'>>) => void;
}

const useTimelineNav = create<TimelineNav>((set) => ({
  reignIndex: 0,
  milestoneIndex: 0,
  attract: true,
  set: (patch) => set(patch),
}));

function loadCache(): TimelineDoc | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? TimelineSchema.parse(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function preload(doc: TimelineDoc): Promise<void> {
  const urls = doc.reigns.flatMap((r) => [r.portrait, ...r.milestones.map((m) => m.image)]);
  return Promise.all(
    urls.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
        }),
    ),
  ).then(() => undefined);
}

function formatHijriRange(from: number, to: number | null) {
  return to ? `${from} – ${to}` : `${from} – …`;
}

export default function TimelinePage() {
  const { t, lang } = useI18n();
  const [doc, setDoc] = useState<TimelineDoc | null>(null);
  const { reignIndex, milestoneIndex, attract, set } = useTimelineNav();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let loaded: TimelineDoc | null = null;
      try {
        loaded = await api.getTimeline();
        localStorage.setItem(CACHE_KEY, JSON.stringify(loaded));
      } catch {
        loaded = loadCache();
      }
      if (!loaded || cancelled) return;
      await preload(loaded);
      if (!cancelled) setDoc(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const touch = useCallback(() => {
    if (useTimelineNav.getState().attract) set({ attract: false });
  }, [set]);

  useEffect(() => {
    let timer = setTimeout(() => set({ attract: true, reignIndex: 0, milestoneIndex: 0 }), IDLE_MS);
    const bump = () => {
      clearTimeout(timer);
      timer = setTimeout(() => set({ attract: true, reignIndex: 0, milestoneIndex: 0 }), IDLE_MS);
    };
    window.addEventListener('pointerdown', bump);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', bump);
    };
  }, [set]);

  if (!doc) {
    return (
      <Stage>
        <SndPatternFrame className="snd-grid flex h-full w-full items-center justify-center bg-night text-5xl">
          {t('common.loading')}
        </SndPatternFrame>
      </Stage>
    );
  }

  const reign = doc.reigns[reignIndex];
  const milestone = reign.milestones[milestoneIndex];
  const milestoneTitle = lang === 'ar' ? milestone.titleAr : milestone.titleEn;
  const milestoneBody = lang === 'ar' ? milestone.bodyAr : milestone.bodyEn;

  if (attract) {
    return (
      <Stage>
        <button
          type="button"
          className="snd-grid relative flex h-full w-full flex-col overflow-hidden bg-night"
          onClick={touch}
        >
          <SndPatternFrame className="flex h-full flex-col" side={false} bottom={false}>
            <WaveOverlay />
            <div className="flex flex-1 flex-col items-center justify-center px-20 py-16 text-center">
              <SndLogo height={96} className="mb-8" />
              <SaduSleepingLine className="mb-10 w-full max-w-xl" />
              <h1 className="font-display max-w-4xl text-8xl leading-tight text-sand">{t('timeline.title')}</h1>
              <div className="satorp-line-gradient mt-8 h-1 w-full max-w-lg rounded-full" />
              <p className="mt-10 animate-pulse text-4xl text-sand/60">{t('timeline.attract')}</p>
              <CoBrand tone="dark" className="mt-12 text-2xl text-sand/70" />
            </div>
          </SndPatternFrame>
        </button>
      </Stage>
    );
  }

  return (
    <Stage>
      <SndPatternFrame className="snd-grid flex h-full w-full flex-col bg-night p-12">
        <div className="flex h-full flex-1 flex-col" onPointerDown={touch}>
          <WaveOverlay className="opacity-80" />

          <div className="flex flex-1 flex-col">
          <SndTitleBlock title={t('timeline.title')} className="mb-10" />

          <nav className="mb-10 flex gap-4">
            {doc.reigns.map((r, i) => (
              <ReignTab
                key={r.id}
                active={i === reignIndex}
                name={lang === 'ar' ? r.nameAr : r.nameEn}
                range={formatHijriRange(r.hijriFrom, r.hijriTo)}
                onClick={() => set({ reignIndex: i, milestoneIndex: 0 })}
              />
            ))}
          </nav>

          <div className="flex flex-1 items-stretch gap-14">
            <article className="flex flex-1 flex-col justify-center pe-4">
              <p className="mb-3 font-display text-4xl text-snd-terracotta">{milestone.year} هـ</p>
              <h2 className="mb-6 font-display text-6xl leading-tight text-sand">{milestoneTitle}</h2>
              <p className="max-w-3xl text-3xl leading-relaxed text-sand/85">{milestoneBody}</p>
            </article>
            <TimelineMedia src={milestone.image} title={milestoneTitle} />
          </div>

          <nav className="mt-10 flex justify-center gap-6">
            {reign.milestones.map((m, i) => (
              <MilestoneChip
                key={m.id}
                active={i === milestoneIndex}
                label={`${m.year} هـ`}
                onClick={() => set({ milestoneIndex: i })}
              />
            ))}
          </nav>
          </div>
        </div>
      </SndPatternFrame>
    </Stage>
  );
}
