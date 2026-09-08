import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import type { Handlers, Transport } from './index';

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

// Laravel broadcasts through Reverb; the browser listens with Echo over the
// Pusher protocol. Event names use broadcastAs(), so Echo needs a LEADING DOT
// to bypass namespacing: `.message.published` (spec §4).
export class EchoTransport implements Transport {
  readonly mode = 'echo' as const;
  private echo: Echo<'reverb'>;

  constructor() {
    window.Pusher = Pusher;
    this.echo = new Echo({
      broadcaster: 'reverb',
      key: process.env.NEXT_PUBLIC_REVERB_APP_KEY ?? '',
      wsHost: process.env.NEXT_PUBLIC_REVERB_HOST ?? window.location.hostname,
      wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
      forceTLS: false,
      enabledTransports: ['ws', 'wss'],
    });
  }

  subscribe(channel: string, handlers: Handlers): () => void {
    // console is a private channel → Laravel /broadcasting/auth; wall and
    // participation are public and need nothing.
    const ch = channel === 'console' ? this.echo.private(channel) : this.echo.channel(channel);

    const events = Object.keys(handlers).filter((k) => k !== '$resync') as (keyof Handlers)[];
    for (const event of events) {
      ch.listen(`.${String(event)}`, (payload: never) => {
        (handlers[event] as ((p: unknown) => void) | undefined)?.(payload);
      });
    }

    // reconnect detection lives on the raw pusher connection
    const pusher = (this.echo.connector as unknown as { pusher: Pusher }).pusher;
    const onConnected = () => handlers.$resync?.();
    pusher.connection.bind('connected', onConnected);

    return () => {
      pusher.connection.unbind('connected', onConnected);
      this.echo.leave(channel);
    };
  }
}
