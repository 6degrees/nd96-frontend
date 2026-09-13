import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import type { Handlers, Transport } from './index';

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

/*
|--------------------------------------------------------------------------
| Echo Transport
|--------------------------------------------------------------------------
|
| Uses Laravel Echo with Reverb to receive realtime events from Laravel.
| Reverb uses the Pusher protocol, so Pusher is attached to the window
| before Echo is initialized.
|
*/
export class EchoTransport implements Transport {
  readonly mode = 'echo' as const;
  private echo: Echo<'reverb'>;

  /*
  |--------------------------------------------------------------------------
  | Constructor
  |--------------------------------------------------------------------------
  |
  | Initializes Laravel Echo and connects it to the Reverb websocket server.
  |
  */
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

  /*
  |--------------------------------------------------------------------------
  | Subscribe
  |--------------------------------------------------------------------------
  |
  | Subscribes to the requested channel and registers all event handlers.
  |
  | The console channel is private and requires Laravel broadcasting
  | authentication, while wall and participation are public channels.
  |
  */
  subscribe(channel: string, handlers: Handlers): () => void {
    const ch =
      channel === 'console'
        ? this.echo.private(channel)
        : this.echo.channel(channel);

    /*
    |--------------------------------------------------------------------------
    | Event Listeners
    |--------------------------------------------------------------------------
    |
    | $resync is a local connection handler and is not a realtime event,
    | so it must not be registered with Echo.
    |
    | Events use broadcastAs(), therefore a leading dot is required to tell
    | Echo to use the event name as-is without applying its namespace.
    |
    */
    const events = Object.keys(handlers).filter(
      (k) => k !== '$resync'
    ) as (keyof Handlers)[];

    for (const event of events) {
      ch.listen(`.${String(event)}`, (payload: never) => {
        (handlers[event] as ((p: unknown) => void) | undefined)?.(payload);
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Reconnection Detection
    |--------------------------------------------------------------------------
    |
    | Listens directly to the underlying Pusher connection.
    | When the websocket reconnects, the current client state may be stale,
    | so $resync is called to synchronize the state again.
    |
    */
    const pusher = (this.echo.connector as unknown as { pusher: Pusher }).pusher;

    const onConnected = () => handlers.$resync?.();

    pusher.connection.bind('connected', onConnected);

    /*
    |--------------------------------------------------------------------------
    | Cleanup
    |--------------------------------------------------------------------------
    |
    | Removes the connection listener and leaves the channel when the
    | subscription is no longer needed.
    |
    */
    return () => {
      pusher.connection.unbind('connected', onConnected);
      this.echo.leave(channel);
    };
  }
}

