'use client';

import { useEffect, useMemo, useState } from 'react';
import { ApiError, api } from '@/shared/api/client';
import type { ScreenCommand, ApiMessage } from '@/shared/api/types';
import { useI18n } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';
import { SndPatternFrame, WaveOverlay } from '@/shared/ui/snd/Decor';
import { PageHeader } from '@/shared/ui/snd/PageHeader';

// Operations console (spec §6).
// Auth: Sanctum same-origin cookie session when served from Laravel
// public/app/. A 401 from any call routes to /console/login (TODO once the
// backend's Sanctum endpoints exist — Tue 15 Sep dependency).
// TODO: virtualise the list beyond 300 rows.

const COMMANDS: { command: ScreenCommand['command']; labelKey: `console.commands.${ScreenCommand['command']}`; variant: 'primary' | 'satorp' | 'danger' }[] = [
  { command: 'clear', labelKey: 'console.commands.clear', variant: 'satorp' },
  { command: 'holding', labelKey: 'console.commands.holding', variant: 'satorp' },
  { command: 'resume', labelKey: 'console.commands.resume', variant: 'primary' },
  { command: 'resetEvent', labelKey: 'console.commands.resetEvent', variant: 'danger' },
];

export default function ConsolePage() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [pendingCommand, setPendingCommand] = useState<ScreenCommand['command'] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      published: messages.filter((m) => m.is_active).length,
      hidden: messages.filter((m) => !m.is_active).length,
    }),
    [messages],
  );

  const load = async () => {
    try {
      const page = await api.getMessages({ status: 'all', per_page: 200 });
      setMessages(page.data);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setNotice('Not authenticated — Sanctum login flow lands with the backend (15 Sep).');
      }
    }
  };

  useEffect(() => {
    void load();
    const id = setInterval(load, 5_000);
    return () => clearInterval(id);
  }, []);

  const setStatus = async (msg: ApiMessage, status: 'published' | 'hidden') => {
    const before = messages;
    setMessages((ms) => ms.map((m) => (m.id === msg.id ? { ...m, status } : m)));
    try {
      await api.patchMessage(msg.id, { status });
    } catch {
      setMessages(before);
      setNotice(`Could not update ${msg.id} — change rolled back.`);
    }
  };

  const runCommand = async () => {
    if (!pendingCommand) return;
    const command = pendingCommand;
    setPendingCommand(null);
    try {
      await api.postScreenCommand({ command });
      setNotice(`Command sent: ${command}`);
    } catch {
      setNotice(`Command failed: ${command}`);
    }
  };

  return (
    <main className="snd-grid relative min-h-[100dvh] bg-night text-sand">
      <SndPatternFrame className="min-h-[100dvh]" side={false} bottom={false}>
        <WaveOverlay className="pointer-events-none opacity-50" />

        <div className="relative z-10 mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
          <PageHeader title={t('console.title')} subtitle={t('console.subtitle')} className="mb-8" />

          <section className="mb-8 rounded-2xl border border-saudi/20 bg-snd-grid p-5 sm:p-6">
            <h2 className="mb-4 font-display text-xl text-sand">{t('console.screenControl')}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {COMMANDS.map(({ command, labelKey, variant }) => (
                <Button
                  key={command}
                  variant={variant}
                  className="min-h-[52px] w-full text-base font-semibold"
                  onClick={() => setPendingCommand(command)}
                >
                  {t(labelKey)}
                </Button>
              ))}
            </div>
          </section>

          {notice && (
            <p className="mb-6 rounded-xl border border-saudi/30 bg-snd-grid px-4 py-3 text-sand" role="status">
              {notice}
            </p>
          )}

          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-xl text-sand">{t('console.messages')}</h2>
              <p className="font-mono text-sm text-sand/45">
                {counts.published} {t('console.published')} · {counts.hidden} {t('console.hidden')}
              </p>
            </div>

            {messages.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-snd-grid px-5 py-10 text-center text-sand/50">{t('console.empty')}</p>
            ) : (
              <ul className="space-y-3">
                {messages.map((m) => (
                  <li
                    key={m.id}
                    className={`flex flex-wrap items-center gap-4 rounded-2xl border border-saudi/20 bg-snd-grid p-4 transition sm:p-5 ${!m.is_active ? 'opacity-50' : ''}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="user-text text-lg leading-snug text-sand">{m.message}</p>
                      <p className="user-text mt-1 text-sm text-sand/50">
                        {m.name}
                        {m.department ? ` · ${m.department}` : ''} · {new Date(m.created_at).toLocaleTimeString('en-US')}
                      </p>
                    </div>
                    {m.is_active ? (
                      <Button
                        variant="secondary"
                        className="shrink-0 border border-white/15 bg-night text-sand hover:bg-white/10"
                        onClick={() => void setStatus(m, 'hidden')}
                      >
                        {t('console.hide')}
                      </Button>
                    ) : (
                      <Button variant="primary" className="shrink-0" onClick={() => void setStatus(m, 'published')}>
                        {t('console.restore')}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </SndPatternFrame>

      <Dialog
        open={pendingCommand !== null}
        title={t('console.confirmTitle')}
        confirmLabel={t('console.confirm')}
        cancelLabel={t('console.cancel')}
        onConfirm={() => void runCommand()}
        onCancel={() => setPendingCommand(null)}
      >
        <p className="font-mono text-satorp-blue">{pendingCommand}</p>
      </Dialog>
    </main>
  );
}
