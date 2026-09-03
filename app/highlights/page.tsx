'use client';

import { useEffect, useState } from 'react';
import { api } from '@/shared/api/client';
import type { Message, TimelineDoc } from '@/shared/api/types';
import { useI18n } from '@/shared/i18n';
import { CoBrand, SaduDivider, SatorpRule } from '@/shared/ui/Brand';
import { LangToggle } from '@/shared/ui/LangToggle';
import { SignatureMark } from '@/shared/ui/SignatureMark';
import { SaduSleepingLine, SndPatternFrame, WaveOverlay } from '@/shared/ui/snd/Decor';
import { WallFillBackdrop } from '@/shared/ui/snd/WallFillBackdrop';

// Post-event, read-only view of the wall and the timeline (spec §1).
// Backend owns the static export and access control.
export default function HighlightsPage() {
  const { t, lang } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [timeline, setTimeline] = useState<TimelineDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      api.getMessages({ status: 'published', limit: 200 }),
      api.getTimeline(),
    ])
      .then(([page, doc]) => {
        if (cancelled) return;
        setMessages(page.items);
        setTimeline(doc);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="snd-grid relative min-h-[100dvh] bg-night text-sand">
      <WallFillBackdrop count={messages.length} />
      <SndPatternFrame className="relative z-10 min-h-[100dvh]" side={false} bottom={false}>
        <WaveOverlay className="pointer-events-none opacity-40" />

        <div className="relative z-10 mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl text-sand sm:text-5xl">{t('highlights.title')}</h1>
              <p className="mt-1 text-lg text-sand/60 sm:text-xl">{t('highlights.subtitle')}</p>
            </div>
            <div className="flex items-center gap-3">
              <CoBrand tone="dark" className="hidden text-sand sm:flex" />
              <LangToggle tone="dark" className="min-h-[44px] px-4 text-base text-sand" />
            </div>
          </header>

          <SatorpRule className="mb-6" />
          <SaduSleepingLine className="mb-10 w-full max-w-lg" />

          {loading ? (
            <p className="text-center text-xl text-sand/50">{t('common.loading')}</p>
          ) : (
            <>
              <section className="mb-14">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <h2 className="font-display text-2xl text-sand sm:text-3xl">{t('highlights.messagesSection')}</h2>
                  <span className="font-mono text-sm text-sand/40">{messages.length}</span>
                </div>

                {messages.length === 0 ? (
                  <p className="rounded-2xl border border-saudi/20 bg-snd-grid px-5 py-10 text-center text-sand/50">
                    {t('highlights.noMessages')}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {messages.map((m) => (
                      <article
                        key={m.id}
                        className="flex flex-col rounded-2xl border border-saudi/20 bg-snd-grid p-5 transition hover:border-saudi/40 sm:p-6"
                      >
                        <p className="user-text flex-1 text-lg leading-relaxed text-sand">{m.body}</p>
                        <div className="mt-4 flex items-end justify-between gap-4 border-t border-white/10 pt-3">
                          <p className="user-text min-w-0 truncate text-sm text-sand/50">
                            {m.name}
                            {m.department ? ` · ${m.department}` : ''}
                          </p>
                          <SignatureMark svg={m.signatureSvg} className="h-10 w-28 shrink-0 text-sand/75" />
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {timeline && (
                <section>
                  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                    <h2 className="font-display text-2xl text-sand sm:text-3xl">{t('highlights.timelineSection')}</h2>
                    <span className="font-mono text-sm text-sand/40">{timeline.reigns.length}</span>
                  </div>

                  <ol className="space-y-4">
                    {timeline.reigns.map((r) => (
                      <li
                        key={r.id}
                        className="rounded-2xl border border-saudi/20 bg-snd-grid p-5 sm:p-6"
                      >
                        <h3 className="font-display text-xl text-snd-bright sm:text-2xl">
                          {lang === 'ar' ? r.nameAr : r.nameEn}
                        </h3>
                        <p className="mt-2 font-mono text-sm text-sand/45">
                          {r.hijriFrom} – {r.hijriTo ?? '…'} هـ · {r.milestones.length} {t('highlights.milestones')}
                        </p>
                        <ul className="mt-4 flex flex-wrap gap-2">
                          {r.milestones.map((m) => (
                            <li
                              key={m.id}
                              className="rounded-full border border-saudi/25 bg-night px-3 py-1 font-mono text-xs text-sand/55"
                            >
                              {m.year} هـ
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              <footer className="mt-14 border-t border-white/10 pt-8">
                <SaduDivider className="mb-6" />
                <CoBrand tone="dark" className="text-sand/70" />
              </footer>
            </>
          )}
        </div>
      </SndPatternFrame>
    </main>
  );
}
