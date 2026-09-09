'use client';

import { useEffect, useState } from 'react';
import { api } from '@/shared/api/client';
import type { ApiMessage, TimelineDoc } from '@/shared/api/types';
import { useI18n } from '@/shared/i18n';
import { CoBrand, SaduDivider } from '@/shared/ui/Brand';
import { SignatureMark } from '@/shared/ui/SignatureMark';
import { SndPatternFrame, WaveOverlay } from '@/shared/ui/snd/Decor';
import { PageHeader } from '@/shared/ui/snd/PageHeader';

// Post-event, read-only view of the wall and the timeline (spec §1).
// Backend owns the static export and access control.
export default function HighlightsPage() {
  const { t, lang } = useI18n();
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [timeline, setTimeline] = useState<TimelineDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        // Wait for MSW in mock mode so the first fetch isn't a bare 404
        if (process.env.NEXT_PUBLIC_API_MODE === 'mock') {
          const { startMocks } = await import('@/mocks/browser');
          await startMocks();
        }
        if (cancelled) return;
        const [page, doc] = await Promise.all([
          api.getMessages({ status: 'published', limit: 200 }),
          api.getTimeline(),
        ]);
        if (cancelled) return;
        setMessages(page.items);
        setTimeline(doc);
      } catch (err) {
        console.error('[highlights] failed to load archive', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="snd-grid relative min-h-[100dvh] bg-night text-sand">
      <SndPatternFrame className="relative z-10 min-h-[100dvh]" side={false} bottom={false}>
        <WaveOverlay className="pointer-events-none opacity-50" />

        <div className="relative z-10 mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
          <PageHeader title={t('highlights.title')} subtitle={t('highlights.subtitle')} className="mb-10" />

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
