'use client';

import { useEffect, useState } from 'react';
import { ApiError, api } from '@/shared/api/client';
import type { Message, ScreenCommand } from '@/shared/api/types';
import { useI18n } from '@/shared/i18n';
import { CoBrand, SatorpRule } from '@/shared/ui/Brand';
import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';
import { LangToggle } from '@/shared/ui/LangToggle';

// Operations console (spec §6).
// Auth: Sanctum same-origin cookie session when served from Laravel
// public/app/. A 401 from any call routes to /console/login (TODO once the
// backend's Sanctum endpoints exist — Tue 15 Sep dependency).
// TODO: virtualise the list beyond 300 rows.

const COMMANDS: ScreenCommand['command'][] = ['clear', 'holding', 'resume', 'resetEvent'];

export default function ConsolePage() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingCommand, setPendingCommand] = useState<ScreenCommand['command'] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    try {
      const page = await api.getMessages({ status: 'all', limit: 200 });
      setMessages(page.items);
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

  // Optimistic hide/restore with rollback on failure. Hidden, never deleted —
  // a removed message must be restorable if an operator taps the wrong row.
  const setStatus = async (msg: Message, status: 'published' | 'hidden') => {
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

  // The console is a SATORP corporate surface: ice ground, blue type, white
  // cards. Text on SATORP surfaces is blue/ice/white/gradient only (p61).
  return (
    <main className="min-h-[100dvh] bg-satorp-ice50 text-satorp-blue">
      <div className="mx-auto max-w-5xl p-8">
        <header className="mb-2 flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('console.title')}</h1>
          <div className="flex items-center gap-4">
            <CoBrand tone="light" className="hidden text-satorp-blue sm:flex" />
            <LangToggle className="bg-satorp-blue/10 text-satorp-blue" />
          </div>
        </header>
        <SatorpRule className="mb-8" />

        <section className="mb-8 flex flex-wrap gap-3">
          {COMMANDS.map((c) => (
            <Button
              key={c}
              variant={c === 'resetEvent' ? 'danger' : 'satorp'}
              onClick={() => setPendingCommand(c)}
            >
              {c}
            </Button>
          ))}
        </section>

        {notice && (
          <p className="mb-4 rounded-xl bg-satorp-cyan50/40 p-3" role="status">
            {notice}
          </p>
        )}

        <ul className="space-y-2">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ${m.status === 'hidden' ? 'opacity-40' : ''}`}
            >
              <div className="min-w-0 flex-1">
                <p className="user-text truncate text-lg">{m.body}</p>
                <p className="user-text text-sm opacity-60">
                  {m.name}
                  {m.department ? ` · ${m.department}` : ''} · {new Date(m.createdAt).toLocaleTimeString('en-US')}
                </p>
              </div>
              {m.status === 'published' ? (
                <Button variant="secondary" className="bg-satorp-blue/10 text-satorp-blue" onClick={() => void setStatus(m, 'hidden')}>
                  {t('console.hide')}
                </Button>
              ) : (
                <Button variant="secondary" className="bg-satorp-blue text-white" onClick={() => void setStatus(m, 'published')}>
                  {t('console.restore')}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* in-page dialog — never window.confirm */}
      <Dialog
        open={pendingCommand !== null}
        title={t('console.confirmTitle')}
        confirmLabel={t('console.confirm')}
        cancelLabel={t('console.cancel')}
        onConfirm={() => void runCommand()}
        onCancel={() => setPendingCommand(null)}
      >
        <p className="font-mono">{pendingCommand}</p>
      </Dialog>
    </main>
  );
}
