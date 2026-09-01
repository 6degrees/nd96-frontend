'use client';

import { useEffect, useState } from 'react';
import { api } from '@/shared/api/client';
import type { Message, TimelineDoc } from '@/shared/api/types';
import { useI18n } from '@/shared/i18n';
import { CoBrand, SatorpRule } from '@/shared/ui/Brand';
import { LangToggle } from '@/shared/ui/LangToggle';

// Post-event, read-only view of the wall and the timeline (spec §1).
// Backend owns the static export and access control.
export default function HighlightsPage() {
  const { t, lang } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [timeline, setTimeline] = useState<TimelineDoc | null>(null);

  useEffect(() => {
    void api.getMessages({ status: 'published', limit: 200 }).then((p) => setMessages(p.items));
    void api.getTimeline().then(setTimeline);
  }, []);

  // Post-event archive: co-branded — SND cream ground, SATORP accents.
  return (
    <main className="min-h-[100dvh] bg-sand text-snd-night">
      <div className="mx-auto max-w-4xl p-8">
      <div aria-hidden className="snd-checker -mx-8 -mt-8 mb-8 h-4" />
      <header className="mb-2 flex items-center justify-between">
        <h1 className="font-display text-3xl">{t('wall.title')}</h1>
        <LangToggle className="bg-snd-night/10 text-snd-night" />
      </header>
      <CoBrand tone="light" className="mb-4 text-snd-night/80" />
      <SatorpRule className="mb-8" />

      <section className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {messages.map((m) => (
          <article key={m.id} className="rounded-xl bg-white p-5 shadow-sm">
            <p className="user-text mb-2 text-lg">{m.body}</p>
            <p className="user-text text-sm opacity-60">
              {m.name}
              {m.department ? ` · ${m.department}` : ''}
            </p>
          </article>
        ))}
      </section>

      {timeline && (
        <section>
          <h2 className="mb-6 text-2xl font-bold">{t('timeline.title')}</h2>
          <ol className="space-y-4">
            {timeline.reigns.map((r) => (
              <li key={r.id} className="rounded-xl bg-white p-5 shadow-sm">
                <h3 className="text-xl font-semibold text-saudi">{lang === 'ar' ? r.nameAr : r.nameEn}</h3>
                <p className="text-sm opacity-60">
                  {r.hijriFrom} – {r.hijriTo ?? '…'} هـ · {r.milestones.length} milestones
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}
      </div>
    </main>
  );
}
