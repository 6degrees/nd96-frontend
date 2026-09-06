'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/shared/api/client';
import type { Message } from '@/shared/api/types';
import { useI18n } from '@/shared/i18n';
import { FitText } from '@/shared/stage/FitText';
import { Stage } from '@/shared/stage/Stage';
import { createTransport } from '@/shared/transport';
import { CoBrand } from '@/shared/ui/Brand';
import { Button } from '@/shared/ui/Button';
import { MessageTitleRail, MotifTriple, SndPatternFrame, WaveOverlay } from '@/shared/ui/snd/Decor';
import { MonumentProgress } from '@/shared/ui/snd/MonumentProgress';
import { PageHeader } from '@/shared/ui/snd/PageHeader';
import { PixelRevealBackdrop } from '@/shared/ui/snd/PixelRevealBackdrop';
import { SignatureMark } from '@/shared/ui/SignatureMark';

// Wall v2 — living mosaic + monument fill.
// New publishes pop full-screen for 3s (queued), then return to the grid.

const ROTATE_MS = 5_500;
const WATCHDOG_MS = 60_000;
const PRESENT_FADE_MS = 800;
const CARD_FADE_MS = 480;
const CARD_STAGGER_MS = 36;
const MOSAIC_SLOTS = 24;
const POP_HOLD_MS = 3_000;
const POP_FADE_MS = 420;

export default function WallV2Page() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]); // newest first
  const [pointer, setPointer] = useState(0);
  const [stale, setStale] = useState(false);
  const [holding, setHolding] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [showPresentGate, setShowPresentGate] = useState(true);
  const [pop, setPop] = useState<Message | null>(null);
  const [popVisible, setPopVisible] = useState(false);

  const seen = useRef(new Set<string>());
  const lastActivity = useRef(Date.now());
  const popQueue = useRef<Message[]>([]);
  const showingPop = useRef(false);
  const presentingRef = useRef(false);
  const holdingRef = useRef(false);
  const popHoldTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    presentingRef.current = presenting;
  }, [presenting]);

  useEffect(() => {
    holdingRef.current = holding;
  }, [holding]);

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

  const dismissPop = useCallback(() => {
    clearPopTimers();
    showingPop.current = false;
    setPopVisible(false);
    setPop(null);
  }, [clearPopTimers]);

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

  const enqueuePop = useCallback(
    (message: Message) => {
      popQueue.current.push(message);
      showNextPop();
    },
    [showNextPop],
  );

  const exitPresentMode = useCallback(() => {
    popQueue.current = [];
    dismissPop();
    setPresenting(false);
    setShowPresentGate(true);
  }, [dismissPop]);

  const resync = async () => {
    const page = await api.getMessages({ status: 'published', limit: 200 });
    seen.current = new Set(page.items.map((m) => m.id));
    setMessages(page.items);
    lastActivity.current = Date.now();
  };

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
          'message.published': ({ message }) => {
            if (seen.current.has(message.id)) return;
            seen.current.add(message.id);
            lastActivity.current = Date.now();
            setMessages((ms) => [message, ...ms]);
            enqueuePop(message);
          },
          'message.updated': ({ message }) => {
            lastActivity.current = Date.now();
            setMessages((ms) => ms.map((m) => (m.id === message.id ? message : m)));
          },
          'message.hidden': ({ id }) => {
            lastActivity.current = Date.now();
            setMessages((ms) => ms.filter((m) => m.id !== id));
            popQueue.current = popQueue.current.filter((m) => m.id !== id);
          },
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

    return () => {
      cancelled = true;
      unsubscribe?.();
      clearPopTimers();
    };
  }, [clearPopTimers, dismissPop, enqueuePop, exitPresentMode, showNextPop]);

  // After holding ends, drain any queued pops
  useEffect(() => {
    if (!presenting || holding) return;
    showNextPop();
  }, [presenting, holding, showNextPop]);

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

  useEffect(() => {
    if (!presenting || holding || pop) return;
    const id = setInterval(() => setPointer((p) => p + 1), ROTATE_MS);
    return () => clearInterval(id);
  }, [presenting, holding, pop]);

  useEffect(() => {
    const id = setInterval(() => setStale(Date.now() - lastActivity.current > WATCHDOG_MS), 5_000);
    return () => clearInterval(id);
  }, []);

  const startPresent = () => {
    setPresenting(true);
    window.setTimeout(() => setShowPresentGate(false), PRESENT_FADE_MS);
  };

  const gridOpacity = holding ? 0 : !presenting ? 0.5 : pop ? 0.28 : 0.82;
  const dockOpacity = holding ? 0 : !presenting ? 0.35 : pop ? 0.55 : 1;

  return (
    <Stage fit="cover">
      <div className="relative h-full w-full bg-night">
        <PixelRevealBackdrop count={messages.length} />
        <WaveOverlay className="pointer-events-none z-[1] opacity-25" />

        <SndPatternFrame
          className="relative z-10 flex h-full w-full flex-col bg-transparent px-8 pb-6 pt-8"
          side={false}
          bottom={false}
        >
          {!holding && (
            <PageHeader
              title={t('wall.title')}
              subtitle={t('wall.v2Subtitle')}
              className="mb-4 shrink-0"
            />
          )}

          <div
            className="relative grid min-h-0 flex-1 grid-cols-6 grid-rows-4 gap-3 transition-opacity duration-700 ease-out"
            style={{ opacity: gridOpacity }}
          >
            {Array.from({ length: MOSAIC_SLOTS }, (_, i) => {
              const msg = messages.length > 0 ? messages[(pointer + i) % messages.length] : null;
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
            <div className="absolute bottom-4 end-4 z-40 h-3 w-3 rounded-full bg-amber-500" title="degraded" />
          )}
        </SndPatternFrame>

        {/* New-message pop — 3s each, queue drains FIFO */}
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
              className="relative z-10 flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-sand/15 bg-night/80 px-12 py-10 shadow-2xl ring-1 ring-snd-bright/20 transition-transform duration-500 ease-out"
              style={{
                transform: popVisible ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(18px)',
              }}
            >
              <MotifTriple className="mb-6" />
              <FitText id={pop.id} text={pop.body} min={28} max={56} className="min-h-[9rem] flex-1 text-center" />
              <div className="mt-8 flex items-end justify-between gap-6 border-t border-white/10 pt-6">
                <div className="min-w-0">
                  <p className="user-text truncate font-display text-3xl text-sand">{pop.name}</p>
                  {pop.department ? (
                    <p className="mt-1 truncate text-lg text-sand/45">{pop.department}</p>
                  ) : null}
                </div>
                <SignatureMark svg={pop.signatureSvg} className="h-14 w-40 shrink-0 text-sand/80" />
              </div>
            </div>
          </div>
        )}

        {holding && (
          <div className="snd-grid absolute inset-0 z-40 bg-night">
            <SndPatternFrame
              className="flex h-full w-full flex-col items-center justify-center gap-8 px-24"
              side={false}
              bottom={false}
            >
              <WaveOverlay className="opacity-40" />
              <MessageTitleRail title="اليوم الوطني السعودي ٩٦" className="relative z-10" />
              <p className="relative z-10 text-3xl text-sand/55">SATORP · Saudi National Day 96</p>
              <MotifTriple className="relative z-10" tone="cyan" />
              <CoBrand tone="dark" divider={false} logoHeight={56} className="relative z-10 mt-4" />
            </SndPatternFrame>
          </div>
        )}

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
              <MessageTitleRail title="رسائل إلى الوطن" className="relative z-10" />
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
              <p className="relative z-10 text-xl text-sand/40">Tap to reveal the living wall</p>
            </div>
          </div>
        )}
      </div>
    </Stage>
  );
}

function MosaicCard({ message, slotIndex }: { message: Message | null; slotIndex: number }) {
  const [rendered, setRendered] = useState<Message | null>(message);
  const [visible, setVisible] = useState(true);
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    return () => {
      if (swapTimer.current) {
        clearTimeout(swapTimer.current);
        swapTimer.current = null;
      }
    };
  }, [message, rendered?.id, slotIndex]);

  if (!rendered) {
    return <div className="rounded-xl bg-night/40 backdrop-blur-[2px]" />;
  }

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border border-white/5 bg-night/45 px-3 py-2.5 backdrop-blur-[3px] transition-[opacity,transform] ease-in-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transitionDuration: `${CARD_FADE_MS}ms`,
        transitionDelay: visible ? `${slotIndex * CARD_STAGGER_MS}ms` : '0ms',
        willChange: 'opacity, transform',
      }}
    >
      <FitText id={rendered.id} text={rendered.body} min={14} max={22} className="flex-1" />
      <div
        className="mt-1.5 flex items-end justify-between gap-2 transition-opacity ease-in-out"
        style={{ transitionDuration: `${CARD_FADE_MS}ms`, opacity: visible ? 1 : 0 }}
      >
        <p className="user-text min-w-0 truncate text-sm opacity-55">{rendered.name}</p>
        <SignatureMark svg={rendered.signatureSvg} className="h-6 w-16 shrink-0 text-sand/60" />
      </div>
    </div>
  );
}
