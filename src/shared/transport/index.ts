import type { ApiMessage, ScreenCommand, Stats } from '@/shared/api/types';

/*
|--------------------------------------------------------------------------
| Transport
|--------------------------------------------------------------------------
|
| Provides a unified interface for realtime and polling implementations.
| Polling is the default transport, while Echo can be enabled through
| the NEXT_PUBLIC_TRANSPORT environment variable.
|
*/

export interface TransportEvents {
    /*
    |--------------------------------------------------------------------------
    | ApiMessage Events
    |--------------------------------------------------------------------------
    |
    | Events related to message lifecycle changes.
    |
    */
    'message.published': { message: ApiMessage };
    'message.updated': { message: ApiMessage };
    'message.hidden': { id: string };

    /*
    |--------------------------------------------------------------------------
    | Screen Events
    |--------------------------------------------------------------------------
    |
    | Commands sent to control the screen state.
    |
    */
    'screen.command': ScreenCommand;

    /*
    |--------------------------------------------------------------------------
    | Statistics Events
    |--------------------------------------------------------------------------
    |
    | Events related to statistics updates.
    |
    */
    'stats.updated': { stats: Stats };

    /*
    |--------------------------------------------------------------------------
    | Timeline Events
    |--------------------------------------------------------------------------
    |
    | Events used to notify the surface that the timeline has changed.
    |
    */
    'timeline.updated': { version: number };
}

/*
|--------------------------------------------------------------------------
| Event Handlers
|--------------------------------------------------------------------------
|
| Defines handlers for each transport event.
|
| $resync is used when the connection is restored or when a polling gap
| occurs. The surface discards its current state and fetches the latest
| data from the API instead of replaying missed events.
|
*/

export type Handlers = {
    [K in keyof TransportEvents]?: (
        payload: TransportEvents[K]
    ) => void;
} & {
    $resync?: () => void;
};

/*
|--------------------------------------------------------------------------
| Transport Interface
|--------------------------------------------------------------------------
|
| Defines the common contract shared by PollTransport and EchoTransport.
|
*/

export interface Transport {
    /*
    |--------------------------------------------------------------------------
    | Subscribe
    |--------------------------------------------------------------------------
    |
    | Subscribes to a channel and registers handlers for its events.
    | Returns an unsubscribe function that should be called when the
    | subscription is no longer needed.
    |
    */
    subscribe(
        channel: string,
        handlers: Handlers
    ): () => void;

    /*
    |--------------------------------------------------------------------------
    | Transport Mode
    |--------------------------------------------------------------------------
    |
    | Identifies which transport implementation is currently active.
    |
    */
    readonly mode: 'poll' | 'echo';
}

export type TransportMode = Transport['mode'];

/*
|--------------------------------------------------------------------------
| Transport Mode
|--------------------------------------------------------------------------
|
| Determines the active transport from the environment configuration.
| Echo is enabled only when NEXT_PUBLIC_TRANSPORT is explicitly set
| to "echo". Polling is used as the default fallback.
|
*/

export function transportMode(): TransportMode {
    return process.env.NEXT_PUBLIC_TRANSPORT === 'echo'
        ? 'echo'
        : 'poll';
}

/*
|--------------------------------------------------------------------------
| Create Transport
|--------------------------------------------------------------------------
|
| Creates the configured transport implementation.
|
| This function is browser-only and should be called inside useEffect
| or another client-side lifecycle.
|
*/

export async function createTransport(): Promise<Transport> {
    /*
    |--------------------------------------------------------------------------
    | Echo Transport
    |--------------------------------------------------------------------------
    |
    | Use Laravel Echo / realtime transport when explicitly enabled.
    |
    */
    if (transportMode() === 'echo') {
        const { EchoTransport } = await import('./echo');

        return new EchoTransport();
    }

    /*
    |--------------------------------------------------------------------------
    | Poll Transport
    |--------------------------------------------------------------------------
    |
    | Use polling as the default transport.
    |
    */
    const { PollTransport } = await import('./poll');

    return new PollTransport();
}

