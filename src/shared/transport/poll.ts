import { api } from '@/shared/api/client';
import type { Handlers, Transport } from './index';

/*
|--------------------------------------------------------------------------
| Polling Configuration
|--------------------------------------------------------------------------
|
| Defines the polling intervals and the maximum allowed gap between
| successful polling requests before a full resync is triggered.
|
*/
const POLL_MS = 2_000; // acceptance criterion is 3s submit→wall; 2s polling meets it with room
const STATS_POLL_MS = 5_000;
const GAP_MS = 30_000; // any gap over this → wholesale resync (spec §4)

/*
|--------------------------------------------------------------------------
| Poll Transport
|--------------------------------------------------------------------------
|
| Provides the polling implementation of the Transport interface.
|
| The transport periodically requests the latest messages and statistics
| from the API and exposes them through the same event handlers used by
| the Echo transport.
|
*/
export class PollTransport implements Transport {
    /*
    |--------------------------------------------------------------------------
    | Transport Mode
    |--------------------------------------------------------------------------
    */
    readonly mode = 'poll' as const;

    /*
    |--------------------------------------------------------------------------
    | Subscribe
    |--------------------------------------------------------------------------
    |
    | Subscribes to the requested channel and starts the corresponding
    | polling process.
    |
    */
    subscribe(channel: string, handlers: Handlers): () => void {
        switch (channel) {
            /*
            |--------------------------------------------------------------------------
            | Wall Channel
            |--------------------------------------------------------------------------
            |
            | Polls published messages and screen state.
            |
            */
            case 'wall':
                return this.pollMessages(handlers);

            /*
            |--------------------------------------------------------------------------
            | Participation Channel
            |--------------------------------------------------------------------------
            |
            | Polls statistics for the participation surface.
            |
            */
            case 'participation':
                return this.pollStats(handlers);

            /*
            |--------------------------------------------------------------------------
            | Unsupported Channel
            |--------------------------------------------------------------------------
            |
            | Private console channels are handled by the Echo transport.
            | The console uses its own REST endpoints when polling is active.
            |
            */
            default:
                return () => {};
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Poll Messages
    |--------------------------------------------------------------------------
    |
    | Polls the messages endpoint and screen state endpoint.
    |
    | New messages are emitted through the same events that the Echo
    | transport provides, keeping both transport implementations
    | interchangeable.
    |
    */
    private pollMessages(handlers: Handlers): () => void {
        let since = new Date().toISOString();
        let lastSuccess = Date.now();
        let stopped = false;

        /*
        |--------------------------------------------------------------------------
        | Screen State
        |--------------------------------------------------------------------------
        |
        | Tracks the last known screen mode and command sequence so that
        | screen changes can be emitted as realtime-style events.
        |
        */
        let screenMode: 'live' | 'holding' | null = null;
        let screenSeq: number | null = null;

        /*
        |--------------------------------------------------------------------------
        | Poll Tick
        |--------------------------------------------------------------------------
        |
        | Executes one polling cycle.
        |
        */
        const tick = async () => {
            if (stopped) return;

            try {
                /*
                |--------------------------------------------------------------------------
                | Fetch Messages and Screen State
                |--------------------------------------------------------------------------
                |
                | Both requests run in parallel to reduce the time required
                | to complete each polling cycle.
                |
                */
                const [page, screen] = await Promise.all([
                    api.getMessages({
                        status: 'published',
                        since,
                        per_page: 200
                    }),
                    api.getScreenState().catch(() => null),
                ]);

                /*
                |--------------------------------------------------------------------------
                | Connection Gap
                |--------------------------------------------------------------------------
                |
                | Detects whether there was a prolonged gap between successful
                | polling requests.
                |
                */
                const gap = Date.now() - lastSuccess;
                lastSuccess = Date.now();

                /*
                |--------------------------------------------------------------------------
                | Resync
                |--------------------------------------------------------------------------
                |
                | If the polling gap exceeds the configured threshold,
                | discard the current state and perform a wholesale resync.
                |
                | Missed events are never replayed.
                |
                */
                if (gap > GAP_MS) {
                    handlers.$resync?.();
                } else {
                    /*
                    |--------------------------------------------------------------------------
                    | Publish Messages
                    |--------------------------------------------------------------------------
                    |
                    | API results are newest-first, so reverse them before
                    | emitting events to preserve the same ordering as live
                    | realtime events.
                    |
                    */
                    for (const message of [...page.data].reverse()) {
                        handlers['message.published']?.({message});
                    }
                }

                /*
                |--------------------------------------------------------------------------
                | Update ApiMessage Cursor
                |--------------------------------------------------------------------------
                |
                | Uses the newest message creation time as the cursor for
                | the next polling request.
                |
                */
                if (page.data[0]) {
                    since = page.data[0].created_at;
                }

                /*
                |--------------------------------------------------------------------------
                | Screen State Changes
                |--------------------------------------------------------------------------
                |
                | Detects screen mode changes and converts them into the same
                | screen.command events used by the Echo transport.
                |
                */
                if (screen) {
                    /*
                    |--------------------------------------------------------------------------
                    | Mode Change
                    |--------------------------------------------------------------------------
                    */
                    if (
                        screenMode !== null &&
                        screen.mode !== screenMode
                    ) {
                        handlers['screen.command']?.({
                            command:
                                screen.mode === 'holding'
                                    ? 'holding'
                                    : 'resume',
                        });
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Command Change
                    |--------------------------------------------------------------------------
                    |
                    | Uses the command sequence to detect a new one-shot
                    | command and emit it only once.
                    |
                    */
                    if (
                        screenSeq !== null &&
                        screen.commandSeq !== screenSeq &&
                        screen.lastCommand
                    ) {
                        handlers['screen.command']?.({
                            command: screen.lastCommand,
                        });
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Store Screen State
                    |--------------------------------------------------------------------------
                    */
                    screenMode = screen.mode;
                    screenSeq = screen.commandSeq;
                }
            } catch {
                /*
                |--------------------------------------------------------------------------
                | Polling Error
                |--------------------------------------------------------------------------
                |
                | Ignore individual polling failures.
                |
                | The surface watchdog is responsible for detecting
                | prolonged periods without successful updates.
                |
                */
            }
        };

        /*
        |--------------------------------------------------------------------------
        | Start Polling
        |--------------------------------------------------------------------------
        |
        | Executes the polling cycle every POLL_MS milliseconds.
        |
        */
        const id = setInterval(tick, POLL_MS);

        /*
        |--------------------------------------------------------------------------
        | Unsubscribe
        |--------------------------------------------------------------------------
        |
        | Stops future polling cycles and clears the interval.
        |
        */
        return () => {
            stopped = true;
            clearInterval(id);
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Poll Statistics
    |--------------------------------------------------------------------------
    |
    | Polls the statistics endpoint and emits stats.updated events.
    |
    */
    private pollStats(handlers: Handlers): () => void {
        let stopped = false;

        /*
        |--------------------------------------------------------------------------
        | Poll Tick
        |--------------------------------------------------------------------------
        */
        const tick = async () => {
            if (stopped) return;

            try {
                /*
                |--------------------------------------------------------------------------
                | Fetch Statistics
                |--------------------------------------------------------------------------
                */
                const stats = await api.getStats();

                /*
                |--------------------------------------------------------------------------
                | Publish Statistics Update
                |--------------------------------------------------------------------------
                */
                handlers['stats.updated']?.({stats});
            } catch {
                /*
                |--------------------------------------------------------------------------
                | Polling Error
                |--------------------------------------------------------------------------
                |
                | Individual failures are ignored.
                | The watchdog handles prolonged failures.
                |
                */
            }
        };

        /*
        |--------------------------------------------------------------------------
        | Initial Poll
        |--------------------------------------------------------------------------
        |
        | Fetch statistics immediately instead of waiting for the first
        | polling interval.
        |
        */
        void tick();

        /*
        |--------------------------------------------------------------------------
        | Start Polling
        |--------------------------------------------------------------------------
        */
        const id = setInterval(tick, STATS_POLL_MS);

        /*
        |--------------------------------------------------------------------------
        | Unsubscribe
        |--------------------------------------------------------------------------
        */
        return () => {
            stopped = true;
            clearInterval(id);
        };
    }
}
