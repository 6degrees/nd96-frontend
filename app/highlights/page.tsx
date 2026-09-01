'use client';

import { useEffect, useState } from 'react';
import { api } from '@/shared/api/client';
import type { Message, TimelineDoc } from '@/shared/api/types';
import { useI18n } from '@/shared/i18n';
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

  return (
    <main className="mx-auto max-w-4xl p-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('wall.title')}</h1>
        <LangToggle />
      </header>

      <section className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {messages.map((m) => (
          <article key={m.id} className="rounded-xl bg-white/5 p-5">
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
              <li key={r.id} className="rounded-xl bg-white/5 p-5">
                <h3 className="text-xl font-semibold">{lang === 'ar' ? r.nameAr : r.nameEn}</h3>
                <p className="text-sm opacity-60">
                  {r.hijriFrom} – {r.hijriTo ?? '…'} هـ · {r.milestones.length} milestones
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
