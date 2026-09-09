'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/shared/api/client';
import type {ApiMessage} from '@/shared/api/types';
import { useI18n } from '@/shared/i18n';
import { FitText } from '@/shared/stage/FitText';
import { Stage } from '@/shared/stage/Stage';
import { createTransport } from '@/shared/transport';
import { CoBrand } from '@/shared/ui/Brand';
import { Button } from '@/shared/ui/Button';
import { MessageTitleRail, MotifTriple, SndPatternFrame, WaveOverlay } from '@/shared/ui/snd/Decor';
import { MonumentProgress } from '@/shared/ui/snd/MonumentProgress';
import { PageHeader } from '@/shared/ui/snd/PageHeader';
import { PixelRevealBackdrop, pixelRevealLit } from '@/shared/ui/snd/PixelRevealBackdrop';
import { SignatureMark } from '@/shared/ui/SignatureMark';

/*
|--------------------------------------------------------------------------
| Wall Configuration
|--------------------------------------------------------------------------
|
| Defines the timing and layout constants used by the wall presentation.
| These values control rotation, transitions, popups, reveals, and the
| number of messages displayed in the mosaic grid.
|
*/
const ROTATE_MS = 5_500;
const WATCHDOG_MS = 60_000;
const PRESENT_FADE_MS = 800;
const CARD_FADE_MS = 480;
const CARD_STAGGER_MS = 36;
const MOSAIC_SLOTS = 24;
const POP_HOLD_MS = 3_000;
const POP_FADE_MS = 420;
const REVEAL_MS = 6_000; // photo-patch pulse lifetime

/*
|--------------------------------------------------------------------------
| Wall Page
|--------------------------------------------------------------------------
|
| Manages the live message wall, presentation mode, realtime events,
| message rotation, popup queue, mosaic updates, and screen commands.
|
*/
export default function WallV2Page() {
  const { t } = useI18n();

  /*
  |--------------------------------------------------------------------------
  | Page State
  |--------------------------------------------------------------------------
  |
  | Stores the current messages and controls the different presentation
  | states of the wall.
  |
  */
  const [messages, setMessages] = useState<ApiMessage[]>([]); // newest first
  const [pointer, setPointer] = useState(0);
  const [stale, setStale] = useState(false);
  const [holding, setHolding] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [showPresentGate, setShowPresentGate] = useState(true);
  const [pop, setPop] = useState<ApiMessage | null>(null);
  const [popVisible, setPopVisible] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Realtime and Presentation References
  |--------------------------------------------------------------------------
  |
  | Keeps mutable values available to realtime callbacks and timers without
  | requiring those callbacks to be recreated whenever React state changes.
  |
  */
  const seen = useRef(new Set<string>());
  const lastActivity = useRef(Date.now());
  const popQueue = useRef<ApiMessage[]>([]);
  const showingPop = useRef(false);
  const presentingRef = useRef(false);
  const holdingRef = useRef(false);
  const popHoldTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Presentation State Synchronization
  |--------------------------------------------------------------------------
  |
  | Keeps the latest presentation and holding states available to callbacks
  | that are created outside the normal React render lifecycle.
  |
  */
  useEffect(() => {
    presentingRef.current = presenting;
  }, [presenting]);

  useEffect(() => {
    holdingRef.current = holding;
  }, [holding]);

  /*
  |--------------------------------------------------------------------------
  | Popup Timer Cleanup
  |--------------------------------------------------------------------------
  |
  | Clears all active popup timers so a dismissed popup cannot continue
  | executing delayed transitions after it has been removed.
  |
  */
  const clearPopTimers = useCallback(() => {
    if (popHoldTimer.current) {
      clearTimeout(popHoldTimer.current);
      popHoldTimer.current = null;
    }

    if (popFadeTimer.current) {
      clearTimeout(popFadeTimer.current);
      popFadeTimer.current = null;
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Dismiss Popup
  |--------------------------------------------------------------------------
  |
  | Immediately removes the currently displayed popup and resets its
  | associated timers and internal display state.
  |
  */
  const dismissPop = useCallback(() => {
    clearPopTimers();
    showingPop.current = false;
    setPopVisible(false);
    setPop(null);
  }, [clearPopTimers]);

  /*
  |--------------------------------------------------------------------------
  | Show Next Popup
  |--------------------------------------------------------------------------
  |
  | Displays the next queued message while presentation mode is active.
  | Messages are displayed in FIFO order and automatically dismissed after
  | the configured hold duration.
  |
  */
  const showNextPop = useCallback(() => {
    if (!presentingRef.current || holdingRef.current) return;
    if (showingPop.current) return;

    const next = popQueue.current.shift();
    if (!next) return;

    showingPop.current = true;
    setPop(next);
    setPopVisible(false);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPopVisible(true));
    });

    popHoldTimer.current = setTimeout(() => {
      setPopVisible(false);

      popFadeTimer.current = setTimeout(() => {
        setPop(null);
        showingPop.current = false;
        popHoldTimer.current = null;
        popFadeTimer.current = null;
        showNextPop();
      }, POP_FADE_MS);
    }, POP_HOLD_MS);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Enqueue Popup
  |--------------------------------------------------------------------------
  |
  | Adds a newly published message to the popup queue and attempts to
  | display it immediately when the wall is ready.
  |
  */
  const enqueuePop = useCallback(
    (message: ApiMessage) => {
      popQueue.current.push(message);
      showNextPop();
    },
    [showNextPop],
  );

  /*
  |--------------------------------------------------------------------------
  | Live Reveal Effect
  |--------------------------------------------------------------------------
  |
  | Tracks the newly revealed portion of the monument and briefly highlights
  | the corresponding photo tiles whenever a new message is published live.
  |
  */
  const [revealRange, setRevealRange] = useState<[number, number] | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showReveal = useCallback((count: number) => {
    const prevLit = pixelRevealLit(count - 1);
    const newLit = pixelRevealLit(count);

    if (newLit > prevLit) {
      setRevealRange([prevLit, newLit - 1]);

      if (revealTimer.current) clearTimeout(revealTimer.current);

      revealTimer.current = setTimeout(() => setRevealRange(null), REVEAL_MS);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Reveal Timer Cleanup
  |--------------------------------------------------------------------------
  |
  | Prevents the reveal timer from running after the page component has
  | been unmounted.
  |
  */
  useEffect(
    () => () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
    },
    [],
  );

  /*
  |--------------------------------------------------------------------------
  | Exit Presentation Mode
  |--------------------------------------------------------------------------
  |
  | Clears all queued popups and returns the wall to its initial
  | presentation gate.
  |
  */
  const exitPresentMode = useCallback(() => {
    popQueue.current = [];
    dismissPop();
    setPresenting(false);
    setShowPresentGate(true);
  }, [dismissPop]);

  /*
  |--------------------------------------------------------------------------
  | ApiMessage Resynchronization
  |--------------------------------------------------------------------------
  |
  | Reloads the currently published messages from the API and rebuilds
  | the seen-message set to keep realtime updates synchronized with the
  | latest server state.
  |
  */
  const resync = async () => {
    const page = await api.getMessages({ status: 'published', per_page: 200 });
    seen.current = new Set(page.data.map((m) => m.id));
    setMessages(page.data);
    lastActivity.current = Date.now();
  };

  /*
  |--------------------------------------------------------------------------
  | Realtime Transport
  |--------------------------------------------------------------------------
  |
  | Initializes the realtime transport, loads the initial wall state, and
  | subscribes to message and screen events.
  |
  */
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    const boot = async (): Promise<void> => {
        try {
        await api.getConfig();

        if (cancelled) return;

        await resync();

        const transport = await createTransport();

        if (cancelled) return;

        unsubscribe = transport.subscribe('wall', {
          /*
          |--------------------------------------------------------------------------
          | ApiMessage Published
          |--------------------------------------------------------------------------
          |
          | Adds newly published messages to the wall, queues their popup,
          | and triggers the live monument reveal effect.
          |
          */
          'message.published': ({ message }) => {
            if (seen.current.has(message.id)) return;

            seen.current.add(message.id);
            lastActivity.current = Date.now();
            setMessages((ms) => [message, ...ms]);
            enqueuePop(message);
            showReveal(seen.current.size); // photo-patch pulse — live only
          },

          /*
          |--------------------------------------------------------------------------
          | ApiMessage Updated
          |--------------------------------------------------------------------------
          |
          | Replaces the existing message with its latest version while
          | preserving its current position in the wall.
          |
          */
          'message.updated': ({ message }) => {
            lastActivity.current = Date.now();
            setMessages((ms) => ms.map((m) => (m.id === message.id ? message : m)));
          },

          /*
          |--------------------------------------------------------------------------
          | ApiMessage Hidden
          |--------------------------------------------------------------------------
          |
          | Removes hidden messages from both the wall and any pending
          | popup queue.
          |
          */
          'message.hidden': ({ id }) => {
            lastActivity.current = Date.now();
            setMessages((ms) => ms.filter((m) => m.id !== id));
            popQueue.current = popQueue.current.filter((m) => m.id !== id);
          },

          /*
          |--------------------------------------------------------------------------
          | Screen Commands
          |--------------------------------------------------------------------------
          |
          | Handles remote commands that control the presentation state
          | of the wall.
          |
          */
          'screen.command': ({ command }) => {
            if (command === 'holding') {
              setHolding(true);
              clearPopTimers();
              showingPop.current = false;
              setPopVisible(false);
              setPop(null);
            }

            if (command === 'resume') {
              setHolding(false);
            }

            if (command === 'clear' || command === 'resetEvent') {
              popQueue.current = [];
              exitPresentMode();
              void resync();
            }
          },

          /*
          |--------------------------------------------------------------------------
          | Realtime Resync
          |--------------------------------------------------------------------------
          |
          | Allows the transport layer to request a full synchronization
          | whenever the realtime connection detects that local state may
          | be out of date.
          |
          */
          $resync: () => void resync(),
        });

        setStale(false);
      } catch {
        setStale(true);

        if (!cancelled) {
          setTimeout(() => {
            if (!cancelled) void boot();
          }, 3_000);
        }
      }
    };

    void boot();

    /*
    |--------------------------------------------------------------------------
    | Realtime Cleanup
    |--------------------------------------------------------------------------
    |
    | Stops subscriptions and clears active timers when the component
    | is unmounted or the effect is recreated.
    |
    */
    return () => {
      cancelled = true;
      unsubscribe?.();
      clearPopTimers();
    };
  }, [clearPopTimers, dismissPop, enqueuePop, exitPresentMode, showNextPop, showReveal]);

  /*
  |--------------------------------------------------------------------------
  | Drain Popup Queue
  |--------------------------------------------------------------------------
  |
  | After a holding state ends, continue displaying any messages that
  | were queued while the wall was paused.
  |
  */
  useEffect(() => {
    if (!presenting || holding) return;
    showNextPop();
  }, [presenting, holding, showNextPop]);

  /*
  |--------------------------------------------------------------------------
  | Escape Key Handler
  |--------------------------------------------------------------------------
  |
  | Allows presentation mode to be exited using the Escape key.
  |
  */
  useEffect(() => {
    if (!presenting) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;

      e.preventDefault();
      exitPresentMode();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [presenting, exitPresentMode]);

  /*
  |--------------------------------------------------------------------------
  | ApiMessage Rotation
  |--------------------------------------------------------------------------
  |
  | Advances the mosaic pointer periodically while the wall is actively
  | presenting and no popup or holding state is currently active.
  |
  */
  useEffect(() => {
    if (!presenting || holding || pop) return;

    const id = setInterval(() => setPointer((p) => p + 1), ROTATE_MS);

    return () => clearInterval(id);
  }, [presenting, holding, pop]);

  /*
  |--------------------------------------------------------------------------
  | Connection Watchdog
  |--------------------------------------------------------------------------
  |
  | Marks the wall as stale when no realtime activity has been received
  | within the configured watchdog interval.
  |
  */
  useEffect(() => {
    const id = setInterval(
      () => setStale(Date.now() - lastActivity.current > WATCHDOG_MS),
      5_000,
    );

    return () => clearInterval(id);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Start Presentation
  |--------------------------------------------------------------------------
  |
  | Enters presentation mode and fades out the presentation gate after
  | the configured transition duration.
  |
  */
  const startPresent = () => {
    setPresenting(true);

    window.setTimeout(() => setShowPresentGate(false), PRESENT_FADE_MS);
  };

  /*
  |--------------------------------------------------------------------------
  | Presentation Opacity
  |--------------------------------------------------------------------------
  |
  | Adjusts the visibility of the mosaic and progress dock according to
  | the current holding, presentation, and popup states.
  |
  */
  const gridOpacity = holding ? 0 : !presenting ? 0.5 : pop ? 0.28 : 0.82;
  const dockOpacity = holding ? 0 : !presenting ? 0.35 : pop ? 0.55 : 1;

  /*
  |--------------------------------------------------------------------------
  | Wall Layout
  |--------------------------------------------------------------------------
  |
  | Renders the complete wall presentation including the background,
  | message mosaic, progress indicator, popup layer, holding screen,
  | and presentation gate.
  |
  */
  return (
    <Stage fit="cover">
      <div className="relative h-full w-full bg-night">
        <PixelRevealBackdrop count={messages.length} highlightRange={revealRange} />
        <WaveOverlay className="pointer-events-none z-[1] opacity-25" />

        <SndPatternFrame
          className="relative z-10 flex h-full w-full flex-col bg-transparent px-8 pb-6 pt-8"
          side={false}
          bottom={false}>
          {!holding && (
            <PageHeader
              title={t('wall.title')}
              subtitle={t('wall.v2Subtitle')}
              className="mb-4 shrink-0"
            />
          )}

          <div
            className="relative grid min-h-0 flex-1 gap-3 transition-opacity duration-700 ease-out"
            style={{
              opacity: gridOpacity,
              gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
              gridTemplateRows: 'repeat(4, minmax(0, 1fr))',
            }}>
            {Array.from({ length: MOSAIC_SLOTS }, (_, i) => {
              // Never duplicate: one message per slot until the pool exceeds the grid
              const msg =
                messages.length === 0
                  ? null
                  : messages.length <= MOSAIC_SLOTS
                    ? (messages[i] ?? null)
                    : messages[(pointer + i) % messages.length]!;

              return <MosaicCard key={`slot-${i}`} slotIndex={i} message={msg} />;
            })}
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-[34%] bg-gradient-to-t from-night via-night/75 to-transparent"
          />

          <div
            className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center transition-opacity duration-700"
            style={{ opacity: dockOpacity }}
          >
            <MonumentProgress count={messages.length} />
          </div>

          {stale && (
            <div
              className="absolute bottom-4 end-4 z-40 h-3 w-3 rounded-full bg-amber-500"
              title="degraded"
            />
          )}
        </SndPatternFrame>

        {/*
        |--------------------------------------------------------------------------
        | New ApiMessage Popup
        |--------------------------------------------------------------------------
        |
        | Displays newly published messages as a temporary full-screen
        | presentation overlay. Messages are processed in FIFO order.
        |
        */}
        {pop && presenting && !holding && (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center px-16 transition-opacity ease-out"
            style={{
              opacity: popVisible ? 1 : 0,
              transitionDuration: `${POP_FADE_MS}ms`,
            }}
          >
            <div className="absolute inset-0 bg-night/55 backdrop-blur-[2px]" />

            <div
              className="relative z-10 flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-snd-night/10 bg-sand px-12 py-10 text-snd-night shadow-2xl ring-1 ring-sand/30 transition-transform duration-500 ease-out"
              style={{
                transform: popVisible
                  ? 'scale(1) translateY(0)'
                  : 'scale(0.92) translateY(18px)',
              }}
            >
              <MotifTriple className="mb-6" />

              <FitText
                id={pop.id}
                text={pop.message}
                min={28}
                max={56}
                className="min-h-[9rem] flex-1 text-center text-snd-night"
              />

              <div className="mt-8 flex items-end justify-between gap-6 border-t border-snd-night/10 pt-6">
                <div className="min-w-0">
                  <p className="user-text truncate font-display text-3xl text-snd-night">
                    {pop.name}
                  </p>

                  {pop.department ? (
                    <p className="mt-1 truncate text-lg text-snd-night/50">
                      {pop.department?.name_en}
                    </p>
                  ) : null}
                </div>

                <SignatureMark
                  svg={pop.signature}
                  className="h-14 w-40 shrink-0 text-snd-night/70"
                />
              </div>
            </div>
          </div>
        )}

        {/*
        |--------------------------------------------------------------------------
        | Holding Screen
        |--------------------------------------------------------------------------
        |
        | Displays the Saudi National Day holding screen while the wall
        | is temporarily paused by a remote screen command.
        |
        */}
        {holding && (
          <div className="snd-grid absolute inset-0 z-40 bg-night">
            <SndPatternFrame
              className="flex h-full w-full flex-col items-center justify-center gap-8 px-24"
              side={false}
              bottom={false}
            >
              <WaveOverlay className="opacity-40" />

              <MessageTitleRail
                title="اليوم الوطني السعودي ٩٦"
                className="relative z-10"
              />

              <p className="relative z-10 text-3xl text-sand/55">
                SATORP · Saudi National Day 96
              </p>

              <MotifTriple className="relative z-10" tone="cyan" />

              <CoBrand
                tone="dark"
                divider={false}
                logoHeight={56}
                className="relative z-10 mt-4"
              />
            </SndPatternFrame>
          </div>
        )}

        {/*
        |--------------------------------------------------------------------------
        | Presentation Gate
        |--------------------------------------------------------------------------
        |
        | Initial screen shown before presentation mode starts. The user
        | can enter the live wall by pressing the Present button.
        |
        */}
        {showPresentGate && (
          <div
            className="absolute inset-0 z-50 transition-opacity ease-out"
            style={{
              opacity: presenting ? 0 : 1,
              pointerEvents: presenting ? 'none' : 'auto',
              transitionDuration: `${PRESENT_FADE_MS}ms`,
            }}
          >
            <div className="absolute inset-0 bg-night" />

            <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-24">
              <WaveOverlay className="opacity-30" />

              <MessageTitleRail
                title="رسائل إلى الوطن"
                className="relative z-10"
              />

              <p className="relative z-10 text-2xl text-sand/55">
                Raise the monument · عزّنا بطبعنا
              </p>

              <div className="relative z-10 opacity-90">
                <MonumentProgress count={messages.length} />
              </div>

              <Button
                className="relative z-10 min-h-[96px] rounded-2xl px-24 font-display text-5xl shadow-2xl ring-4 ring-sand/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                onClick={startPresent}
              >
                Present · عرض
              </Button>

              <p className="relative z-10 text-xl text-sand/40">
                Tap to reveal the living wall
              </p>
            </div>
          </div>
        )}
      </div>
    </Stage>
  );
}

/*
|--------------------------------------------------------------------------
| Mosaic Card
|--------------------------------------------------------------------------
|
| Renders a single message inside the mosaic grid and smoothly transitions
| between messages when a slot receives a new message.
|
*/
function MosaicCard({message, slotIndex,}: { message: ApiMessage | null; slotIndex: number}) {
  const [rendered, setRendered] = useState<ApiMessage | null>(message);
  const [visible, setVisible] = useState(true);
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /*
  |--------------------------------------------------------------------------
  | ApiMessage Transition
  |--------------------------------------------------------------------------
  |
  | Fades the current message out before replacing it with the next message,
  | then fades the new message back into the slot.
  |
  */
  useEffect(() => {
    const nextId = message?.id ?? null;
    const currentId = rendered?.id ?? null;

    if (nextId === currentId) return;

    if (swapTimer.current) clearTimeout(swapTimer.current);

    setVisible(false);

    swapTimer.current = setTimeout(() => {
      setRendered(message);
      requestAnimationFrame(() => setVisible(true));
      swapTimer.current = null;
    }, CARD_FADE_MS);

    /*
    |--------------------------------------------------------------------------
    | Swap Timer Cleanup
    |--------------------------------------------------------------------------
    |
    | Clears the pending card transition when the component changes or
    | unmounts before the transition has completed.
    |
    */
    return () => {
      if (swapTimer.current) {
        clearTimeout(swapTimer.current);
        swapTimer.current = null;
      }
    };
  }, [message, rendered?.id, slotIndex]);

  /*
  |--------------------------------------------------------------------------
  | Empty Slot
  |--------------------------------------------------------------------------
  |
  | Displays an empty placeholder while the mosaic slot does not have
  | a message assigned to it.
  |
  */
  if (!rendered) {
    return <div className="min-h-0 min-w-0 rounded-xl bg-night/40 backdrop-blur-[2px]" />;
  }

  /*
  |--------------------------------------------------------------------------
  | ApiMessage Card
  |--------------------------------------------------------------------------
  |
  | Displays the message content, author name, and signature with the
  | configured fade and stagger animation.
  |
  */
  return (
    <div
      className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-white/5 bg-night/45 px-3 py-2.5 text-sand backdrop-blur-[3px] transition-[opacity,transform] ease-in-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transitionDuration: `${CARD_FADE_MS}ms`,
        transitionDelay: visible ? `${slotIndex * CARD_STAGGER_MS}ms` : '0ms',
        willChange: 'opacity, transform',
      }}
    >
      <FitText
        id={rendered.id}
        text={rendered.message}
        min={14}
        max={22}
        className="min-h-0 min-w-0 flex-1"
      />

      <div
        className="mt-1.5 flex items-end justify-between gap-2 transition-opacity ease-in-out"
        style={{
          transitionDuration: `${CARD_FADE_MS}ms`,
          opacity: visible ? 1 : 0,
        }}
      >
        <p className="user-text min-w-0 truncate text-sm text-sand/55">
          {rendered.name}
        </p>

        <SignatureMark
          svg={rendered.signature}
          className="h-6 w-16 shrink-0 text-sand/60"
        />
      </div>
    </div>
  );
}

