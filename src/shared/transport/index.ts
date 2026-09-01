import type { Message, ScreenCommand, Stats } from '@/shared/api/types';

// One interface, two implementations. Ship polling, treat Echo as an upgrade
// switched on only after it survives an endurance run on the real network.
// NEXT_PUBLIC_TRANSPORT=poll | echo — one env var, no code change (spec §4).

export interface TransportEvents {
  'message.published': { message: Message };
  'message.updated': { message: Message };
  'message.hidden': { id: string };
  'screen.command': ScreenCommand;
  'stats.updated': { stats: Stats };
  'timeline.updated': { version: number };
}

export type Handlers = {
  [K in keyof TransportEvents]?: (payload: TransportEvents[K]) => void;
} & {
  /**
   * Reconnect policy (spec §4): on reconnect, or any poll gap over 30s, the
   * surface DISCARDS its state and refetches wholesale. Never event replay.
   */
  $resync?: () => void;
};

export interface Transport {
  subscribe(channel: string, handlers: Handlers): () => void;
  readonly mode: 'poll' | 'echo';
}

export type TransportMode = Transport['mode'];

export function transportMode(): TransportMode {
  return process.env.NEXT_PUBLIC_TRANSPORT === 'echo' ? 'echo' : 'poll';
}

// Browser-only: call from useEffect, never during render/prerender.
export async function createTransport(): Promise<Transport> {
  if (transportMode() === 'echo') {
    const { EchoTransport } = await import('./echo');
    return new EchoTransport();
  }
  const { PollTransport } = await import('./poll');
  return new PollTransport();
}
