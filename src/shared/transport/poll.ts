import { api } from '@/shared/api/client';
import type { Handlers, Transport } from './index';

const POLL_MS = 2_000; // acceptance criterion is 3s submit→wall; 2s polling meets it with room
const STATS_POLL_MS = 5_000;
const GAP_MS = 30_000; // any gap over this → wholesale resync (spec §4)

export class PollTransport implements Transport {
  readonly mode = 'poll' as const;

  subscribe(channel: string, handlers: Handlers): () => void {
    switch (channel) {
      case 'wall':
        return this.pollMessages(handlers);
      case 'participation':
        return this.pollStats(handlers);
      default:
        // console (private) channels only matter on the echo transport;
        // the console polls its own REST endpoints instead.
        return () => {};
    }
  }

  private pollMessages(handlers: Handlers): () => void {
    let since = new Date().toISOString();
    let lastSuccess = Date.now();
    let stopped = false;
    // Screen state (proposed contract addition, docs/DATABASE.md): polled
    // alongside messages so console commands reach the wall on this
    // transport. Mode changes and one-shot commands surface as the same
    // 'screen.command' events Echo would deliver.
    let screenMode: 'live' | 'holding' | null = null;
    let screenSeq: number | null = null;

    const tick = async () => {
      if (stopped) return;
      try {
        const [page, screen] = await Promise.all([
          api.getMessages({ status: 'published', since, limit: 200 }),
          api.getScreenState().catch(() => null), // endpoint may not exist yet on a real backend
        ]);
        const gap = Date.now() - lastSuccess;
        lastSuccess = Date.now();
        if (gap > GAP_MS) {
          handlers.$resync?.(); // discard + refetch; never event replay
        } else {
          // newest first — deliver oldest first so ordering matches live events
          for (const message of [...page.items].reverse()) {
            handlers['message.published']?.({ message });
          }
        }
        if (page.items[0]) since = page.items[0].createdAt;

        if (screen) {
          if (screenMode !== null && screen.mode !== screenMode) {
            handlers['screen.command']?.({ command: screen.mode === 'holding' ? 'holding' : 'resume' });
          }
          if (screenSeq !== null && screen.commandSeq !== screenSeq && screen.lastCommand) {
            handlers['screen.command']?.({ command: screen.lastCommand });
          }
          screenMode = screen.mode;
          screenSeq = screen.commandSeq;
        }
      } catch {
        // swallow: the watchdog on the surface handles prolonged silence
      }
    };

    const id = setInterval(tick, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }

  private pollStats(handlers: Handlers): () => void {
    let stopped = false;
    const tick = async () => {
      if (stopped) return;
      try {
        const stats = await api.getStats();
        handlers['stats.updated']?.({ stats });
      } catch {
        /* watchdog handles it */
      }
    };
    void tick();
    const id = setInterval(tick, STATS_POLL_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }
}
