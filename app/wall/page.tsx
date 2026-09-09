'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/shared/api/client';
import type { EventConfig, ApiMessage } from '@/shared/api/types';
import { FitText } from '@/shared/stage/FitText';
import { Stage } from '@/shared/stage/Stage';
import { createTransport } from '@/shared/transport';
import { CoBrand } from '@/shared/ui/Brand';
import { Button } from '@/shared/ui/Button';
import {
  FeaturedMessageSlide,
  wallDesignForIndex,
  type WallDesignId,
} from '@/shared/ui/snd/FeaturedMessageSlide';
import { MessageTitleRail, MotifTriple, SndPatternFrame, WaveOverlay } from '@/shared/ui/snd/Decor';
import { WallFillBackdrop } from '@/shared/ui/snd/WallFillBackdrop';
import { SignatureMark } from '@/shared/ui/SignatureMark';

// The message wall (spec §6). Two decisions carry twelve unattended hours:
//
// 1. CONSTANT DOM — a fixed pool of card slots with stable keys. Content
//    rotates through the slots; nodes are never appended, so the heap stays
//    flat whether 30 or 900 messages have been submitted.
// 2. FEATURE FOREVER — Present starts a continuous featured slideshow over
//    ALL published messages. Design packs cycle 1→6→1…; new publishes jump
//    the priority queue. Never drop back to the grid mid-show.

const ROTATE_MS = 4_000;
const WATCHDOG_MS = 60_000;
const PRESENT_FADE_MS = 800;
const CARD_FADE_MS = 520;
const CARD_STAGGER_MS = 48;
const FEATURE_FADE_MS = 650;

/** One featured slide = one message + one complete design pack (never mixed). */
type FeaturedSlide = { message: ApiMessage; designId: WallDesignId };

export default function WallPage() {
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]); // newest first
  const [featured, setFeatured] = useState<FeaturedSlide | null>(null);
  const [pointer, setPointer] = useState(0);
  const [stale, setStale] = useState(false);
  const [holding, setHolding] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [showPresentGate, setShowPresentGate] = useState(true);
  const [featureShell, setFeatureShell] = useState(false);
  const [featureVisible, setFeatureVisible] = useState(false);

  const featureDesignIndexRef = useRef(0);
  const playlistCursorRef = useRef(0);
  const messagesRef = useRef<ApiMessage[]>([]);
  const priorityQueue = useRef<ApiMessage[]>([]);
  const featuredRef = useRef<FeaturedSlide | null>(null);
  const featureFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seen = useRef(new Set<string>());
  const lastActivity = useRef(Date.now());

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const clearFeatureFade = useCallback(() => {
    if (featureFadeTimer.current) {
      clearTimeout(featureFadeTimer.current);
      featureFadeTimer.current = null;
    }
  }, []);

  const exitPresentMode = useCallback(() => {
    clearFeatureFade();
    featuredRef.current = null;
    setFeatured(null);
    setFeatureShell(false);
    setFeatureVisible(false);
    setPresenting(false);
    setShowPresentGate(true);
  }, [clearFeatureFade]);

  const showFeatured = useCallback((next: ApiMessage) => {
    // Bind message + design pack atomically so photo/crest/line/colors never desync
    const designId = wallDesignForIndex(featureDesignIndexRef.current);
    featureDesignIndexRef.current += 1;
    const slide: FeaturedSlide = { message: next, designId };
    featuredRef.current = slide;
    setFeatureShell(true);
    setFeatured(slide);
  }, []);

  /** New publishes first; otherwise walk every published message and wrap forever. */
  const takeNextMessage = useCallback((): ApiMessage | null => {
    const priority = priorityQueue.current.shift();
    if (priority) return priority;

    const pool = messagesRef.current;
    if (pool.length === 0) return null;

    const idx = ((playlistCursorRef.current % pool.length) + pool.length) % pool.length;
    const next = pool[idx] ?? null;
    playlistCursorRef.current = idx + 1;
    return next;
  }, []);

  // Cold start & recovery: mount → GET /api/messages → full wall restored
  // with zero operator action (acceptance criterion 7).
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
        const cfg = await api.getConfig();
        if (cancelled) return;
        setConfig(cfg);
        await resync();
        const transport = await createTransport();
        if (cancelled) return;
        unsubscribe = transport.subscribe('wall', {
          'message.published': ({ message }) => {
            if (seen.current.has(message.id)) return;
            seen.current.add(message.id);
            lastActivity.current = Date.now();
            setMessages((ms) => [message, ...ms]);
            priorityQueue.current.push(message);
          },
          'message.updated': ({ message }) => {
            lastActivity.current = Date.now();
            setMessages((ms) => ms.map((m) => (m.id === message.id ? message : m)));
          },
          'message.hidden': ({ id }) => {
            lastActivity.current = Date.now();
            setMessages((ms) => ms.filter((m) => m.id !== id));
            priorityQueue.current = priorityQueue.current.filter((m) => m.id !== id);
          },
          'screen.command': ({ command }) => {
            if (command === 'holding') setHolding(true);
            if (command === 'resume') setHolding(false);
            if (command === 'clear' || command === 'resetEvent') {
              priorityQueue.current = [];
              exitPresentMode();
              void resync();
            }
          },
          $resync: () => void resync(), // discard + refetch wholesale, never replay
        });
        setStale(false);
      } catch {
        // A wall powered on before the network (or, in mock mode, before the
        // worker) is up must come up on its own — retry, never give up.
        // Criterion 7: restart restores all messages with zero operator action.
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
    };
  }, [exitPresentMode]);

  // Continuous featured loop — design packs 1…N then wrap; never return to the grid
  useEffect(() => {
    if (!config || !presenting || holding) return;

    const featureSeconds = () =>
      priorityQueue.current.length > 5 ? 5 : config.wall.featureSeconds;

    const advanceFeatured = () => {
      setFeatureVisible(false);
      clearFeatureFade();
      featureFadeTimer.current = setTimeout(() => {
        const next = takeNextMessage();
        if (!next) {
          // No messages yet — keep the shell up and retry; do not show the grid
          featureFadeTimer.current = setTimeout(advanceFeatured, 1_000);
          return;
        }

        showFeatured(next);
        featureFadeTimer.current = setTimeout(advanceFeatured, featureSeconds() * 1_000);
      }, FEATURE_FADE_MS);
    };

    const startFeatured = (next: ApiMessage) => {
      clearFeatureFade();
      showFeatured(next);
      featureFadeTimer.current = setTimeout(advanceFeatured, featureSeconds() * 1_000);
    };

    // Kick off immediately from the full message pool (or priority queue)
    if (!featuredRef.current && !featureFadeTimer.current) {
      const next = takeNextMessage();
      if (next) startFeatured(next);
      else featureFadeTimer.current = setTimeout(advanceFeatured, 500);
    } else if (featuredRef.current && !featureFadeTimer.current) {
      // Effect re-entered mid-slide (e.g. after holding) — keep the loop alive
      featureFadeTimer.current = setTimeout(advanceFeatured, featureSeconds() * 1_000);
    }

    const tick = setInterval(() => {
      if (featuredRef.current || featureFadeTimer.current) return;
      const next = takeNextMessage();
      if (!next) return;
      startFeatured(next);
    }, 500);

    return () => {
      clearInterval(tick);
      clearFeatureFade();
    };
  }, [config, presenting, holding, clearFeatureFade, showFeatured, takeNextMessage]);

  // Esc exits slideshow / full-screen feature back to the wall + Present gate
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

  // Grid rotation — idle wall only (hidden under featured during Present)
  useEffect(() => {
    if (!presenting || holding || featureShell) return;
    const id = setInterval(() => setPointer((p) => p + 1), ROTATE_MS);
    return () => clearInterval(id);
  }, [presenting, holding, featureShell]);

  // Fade featured slide in once a new atomic pack is mounted (owned here, not raced with advance)
  useEffect(() => {
    if (!featured || !presenting || holding) {
      setFeatureVisible(false);
      return;
    }
    setFeatureVisible(false);
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setFeatureVisible(true));
    });
    return () => cancelAnimationFrame(frame);
  }, [featured, presenting, holding]);

  // Watchdog: prolonged silence → discreet corner indicator, never a modal
  useEffect(() => {
    const id = setInterval(() => setStale(Date.now() - lastActivity.current > WATCHDOG_MS), 5_000);
    return () => clearInterval(id);
  }, []);

  const slots = config?.wall.slots ?? 14;

  const startPresent = () => {
    playlistCursorRef.current = 0;
    featureDesignIndexRef.current = 0;
    setFeatureShell(true);
    setPresenting(true);
    window.setTimeout(() => setShowPresentGate(false), PRESENT_FADE_MS);
  };

  return (
    <Stage fit="cover">
      <div className="snd-grid relative h-full w-full bg-night">
        <WallFillBackdrop count={messages.length} />
        <WaveOverlay className="pointer-events-none opacity-35" />

        {/* Wall header banner — only on the message grid, not over featured/holding */}
        {!featureShell && !holding && (
          <header className="absolute inset-x-0 top-0 z-20 h-[140px] overflow-hidden bg-night">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/wall/header-banner.jpg"
              alt="رسائل إلى الوطن — Messages to the Nation"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </header>
        )}

        <SndPatternFrame
          className={`relative z-10 flex h-full w-full flex-col bg-transparent px-8 pb-8 ${featureShell || holding ? 'pt-8' : 'pt-[156px]'}`}
          side={false}
          bottom={false}
        >
        {/* fixed slot pool — keys slot-0…slot-N are stable for 12 hours */}
        <div
          className="grid flex-1 grid-cols-5 grid-rows-3 gap-5 transition-opacity duration-700 ease-out"
          style={{ opacity: holding ? 0 : featureShell ? 0 : presenting ? 1 : 0.92 }}
        >
          {Array.from({ length: slots }, (_, i) => {
            const msg = messages.length > 0 ? messages[(pointer + i) % messages.length] : null;
            return <WallCard key={`slot-${i}`} slotIndex={i} message={msg} />;
          })}
        </div>

        {stale && <div className="absolute bottom-4 end-4 z-40 h-3 w-3 rounded-full bg-amber-500" title="degraded" />}
        </SndPatternFrame>

        {holding && (
          <div className="snd-grid absolute inset-0 z-40 bg-night">
            <SndPatternFrame className="flex h-full w-full flex-col items-center justify-center gap-8 px-24" side={false} bottom={false}>
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
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-10 px-24">
              <WaveOverlay className="opacity-30" />
              <MessageTitleRail title="رسائل إلى الوطن" className="relative z-10" />
              <p className="relative z-10 text-2xl text-sand/55">Messages to the Nation · عزّنا بطبعنا</p>
              <Button
                className="relative z-10 min-h-[96px] rounded-2xl px-24 font-display text-5xl shadow-2xl ring-4 ring-sand/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                onClick={startPresent}
              >
                Present · عرض
              </Button>
              <p className="relative z-10 text-xl text-sand/40">Tap to begin the slideshow</p>
            </div>
          </div>
        )}

        {featureShell && presenting && !holding && (
          // Opaque shell stays up between messages — only content crossfades (spec §6)
          // z-30 covers the wall header so nothing collides with the featured slide
          <div className="absolute inset-0 z-30 overflow-hidden bg-night">
            {featured && (
              <div
                key={`${featured.designId}-${featured.message.id}`}
                className="absolute inset-0 transition-opacity ease-in-out"
                style={{
                  opacity: featureVisible ? 1 : 0,
                  transitionDuration: `${FEATURE_FADE_MS}ms`,
                  willChange: 'opacity',
                }}
              >
                <FeaturedMessageSlide message={featured.message} designId={featured.designId} />
              </div>
            )}
          </div>
        )}
      </div>
    </Stage>
  );
}

function WallCard({ message, slotIndex }: { message: ApiMessage | null; slotIndex: number }) {
  const [rendered, setRendered] = useState<ApiMessage | null>(message);
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
    return <div className="rounded-2xl bg-white/5" />;
  }

  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl bg-white/10 p-5 transition-[opacity,transform] ease-in-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transitionDuration: `${CARD_FADE_MS}ms`,
        transitionDelay: visible ? `${slotIndex * CARD_STAGGER_MS}ms` : '0ms',
        willChange: 'opacity, transform',
      }}
    >
      <FitText id={rendered.id} text={rendered.body} min={20} max={34} className="flex-1" />
      <div
        className="mt-2 flex items-end justify-between gap-3 transition-opacity ease-in-out"
        style={{ transitionDuration: `${CARD_FADE_MS}ms`, opacity: visible ? 1 : 0 }}
      >
        <p className="user-text min-w-0 truncate text-lg opacity-60">{rendered.name}</p>
        <SignatureMark svg={rendered.signatureSvg} className="h-9 w-24 shrink-0 text-sand/70" />
      </div>
    </div>
  );
}
