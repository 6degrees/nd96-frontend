'use client';

import { useCallback, useEffect, useState } from 'react';
import { create } from 'zustand';
import { api } from '@/shared/api/client';
import { TimelineSchema, type TimelineDoc } from '@/shared/api/types';
import { useI18n } from '@/shared/i18n';
import { Stage } from '@/shared/stage/Stage';

const CACHE_KEY = 'nd96.timeline';
const IDLE_MS = 90_000;

// Position lives in a store, not the URL, so the language switch preserves
// { reignIndex, milestoneIndex } exactly — acceptance criterion 10.
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
  // Preload all 21 assets behind the loading gate; tolerate missing files in dev
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
        loaded = loadCache(); // a network blip cannot blank the screen
      }
      if (!loaded || cancelled) return;
      await preload(loaded);
      if (!cancelled) setDoc(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Idle reset to the attract state after 90s with no touch
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
        <div className="flex h-full w-full items-center justify-center bg-night text-5xl">{t('common.loading')}</div>
      </Stage>
    );
  }

  const reign = doc.reigns[reignIndex];
  const milestone = reign.milestones[milestoneIndex];

  if (attract) {
    return (
      <Stage>
        <button type="button" className="flex h-full w-full flex-col items-center justify-center gap-10 bg-night" onClick={touch}>
          <h1 className="text-8xl font-bold">{t('timeline.title')}</h1>
          <p className="animate-pulse text-4xl opacity-60">{t('timeline.attract')}</p>
        </button>
      </Stage>
    );
  }

  return (
    <Stage>
      <div className="flex h-full w-full flex-col bg-night p-12" onPointerDown={touch}>
        <h1 className="mb-8 text-5xl font-bold">{t('timeline.title')}</h1>

        {/* reign rail — hit targets ≥ 80×80 in the 1920×1080 space */}
        <nav className="mb-10 flex gap-4">
          {doc.reigns.map((r, i) => (
            <button
              key={r.id}
              type="button"
              className={`min-h-[80px] min-w-[80px] flex-1 rounded-2xl p-4 text-2xl font-semibold transition-colors ${
                i === reignIndex ? 'bg-saudi text-white' : 'bg-white/10'
              }`}
              onClick={() => set({ reignIndex: i, milestoneIndex: 0 })}
            >
              {lang === 'ar' ? r.nameAr : r.nameEn}
              <div className="mt-1 text-lg opacity-60">
                {r.hijriFrom} – {r.hijriTo ?? '…'}
              </div>
            </button>
          ))}
        </nav>

        <div className="flex flex-1 gap-12">
          <div className="flex-1">
            <h2 className="mb-2 text-6xl font-bold">{lang === 'ar' ? milestone.titleAr : milestone.titleEn}</h2>
            <p className="mb-6 text-3xl opacity-50">{milestone.year} هـ</p>
            <p className="max-w-3xl text-3xl leading-relaxed">{lang === 'ar' ? milestone.bodyAr : milestone.bodyEn}</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={milestone.image} alt="" className="h-[520px] w-[700px] rounded-3xl bg-white/5 object-cover" />
        </div>

        <nav className="mt-8 flex justify-center gap-6">
          {reign.milestones.map((m, i) => (
            <button
              key={m.id}
              type="button"
              className={`min-h-[80px] min-w-[160px] rounded-2xl text-2xl font-semibold ${
                i === milestoneIndex ? 'bg-sand text-night' : 'bg-white/10'
              }`}
              onClick={() => set({ milestoneIndex: i })}
            >
              {m.year} هـ
            </button>
          ))}
        </nav>
      </div>
    </Stage>
  );
}
