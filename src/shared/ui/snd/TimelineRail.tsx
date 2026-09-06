'use client';

import type { Lang, Reign } from '@/shared/api/types';

/**
 * The Kings & Energy journey as an actual timeline: one continuous spine
 * (SATORP element gradient — the energy line) crossing the full stage width,
 * 21 sadu-diamond nodes with Hijri years, grouped under the seven reigns.
 * Hit targets ≥ 80px in the 1920×1080 space (spec §6). RTL-aware: the flex
 * row follows the document direction, so the journey reads right-to-left
 * in Arabic and left-to-right in English.
 */
export function TimelineRail({
  reigns,
  lang,
  reignIndex,
  milestoneIndex,
  onSelect,
}: {
  reigns: Reign[];
  lang: Lang;
  reignIndex: number;
  milestoneIndex: number;
  onSelect: (reign: number, milestone: number) => void;
}) {
  return (
    <div className="w-full select-none">
      {/* node row with the spine through the diamond centers */}
      <div className="relative">
        <div
          aria-hidden
          className="satorp-line-gradient absolute end-0 start-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full opacity-80"
        />
        <div className="relative flex">
          {reigns.map((reign, r) => (
            <div
              key={reign.id}
              className={`flex flex-1 items-stretch justify-around ${r > 0 ? 'border-s border-white/10' : ''}`}
            >
              {reign.milestones.map((m, i) => {
                const active = r === reignIndex && i === milestoneIndex;
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-current={active ? 'step' : undefined}
                    onClick={() => onSelect(r, i)}
                    className="group/node relative h-24 min-w-[80px] flex-1"
                  >
                    <span
                      className={`absolute inset-x-0 top-1 text-center font-mono text-sm transition-colors ${
                        active ? 'font-bold text-sand' : 'text-sand/45 group-hover/node:text-sand/75'
                      }`}
                    >
                      {m.year}
                    </span>
                    <span
                      aria-hidden
                      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 transition-all duration-200 ${
                        active
                          ? 'h-6 w-6 bg-sand shadow-[0_0_24px_rgba(242,236,221,0.55)]'
                          : 'h-3.5 w-3.5 bg-snd-bright/70 group-hover/node:h-5 group-hover/node:w-5 group-hover/node:bg-snd-bright'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* reign band beneath the spine */}
      <div className="mt-2 flex">
        {reigns.map((reign, r) => {
          const activeReign = r === reignIndex;
          return (
            <button
              key={reign.id}
              type="button"
              onClick={() => onSelect(r, 0)}
              className={`min-h-[64px] flex-1 px-2 text-center transition-colors ${r > 0 ? 'border-s border-white/10' : ''}`}
            >
              <span
                className={`font-display block text-xl leading-tight transition-colors ${
                  activeReign ? 'text-sand' : 'text-sand/40'
                }`}
              >
                {lang === 'ar' ? reign.nameAr : reign.nameEn}
              </span>
              <span className={`mt-1 block font-mono text-xs ${activeReign ? 'text-snd-bright' : 'text-sand/30'}`}>
                {reign.hijriFrom} – {reign.hijriTo ?? '…'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
