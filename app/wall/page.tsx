'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/shared/api/client';
import type { EventConfig, Message } from '@/shared/api/types';
import { FitText } from '@/shared/stage/FitText';
import { Stage } from '@/shared/stage/Stage';
import { createTransport } from '@/shared/transport';
import { CoBrand, SaduDivider, SatorpRule } from '@/shared/ui/Brand';
import { Button } from '@/shared/ui/Button';
import { SndPatternFrame } from '@/shared/ui/snd/Decor';
import { WallFillBackdrop } from '@/shared/ui/snd/WallFillBackdrop';

// The message wall (spec §6). Two decisions carry twelve unattended hours:
//
// 1. CONSTANT DOM — a fixed pool of card slots with stable keys. Content
//    rotates through the slots; nodes are never appended, so the heap stays
//    flat whether 30 or 900 messages have been submitted.
// 2. QUEUE, NEVER DROP — every contributor sees their own words featured.
//    Over five queued → shorten the feature to 5s rather than skipping.

const ROTATE_MS = 4_000;
const WATCHDOG_MS = 60_000;
const PRESENT_FADE_MS = 800;
const CARD_FADE_MS = 520;
const CARD_STAGGER_MS = 48;
const FEATURE_FADE_MS = 650;

export default function WallPage() {
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]); // newest first
  const [featured, setFeatured] = useState<Message | null>(null);
  const [pointer, setPointer] = useState(0);
  const [stale, setStale] = useState(false);
  const [holding, setHolding] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [showPresentGate, setShowPresentGate] = useState(true);
  const [featureShell, setFeatureShell] = useState(false);
  const [featureVisible, setFeatureVisible] = useState(false);

  const queue = useRef<Message[]>([]);
  const featuredRef = useRef<Message | null>(null);
  const featureFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seen = useRef(new Set<string>());
  const lastActivity = useRef(Date.now());

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

    (async () => {
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
            queue.current.push(message);
          },
          'message.updated': ({ message }) => {
            lastActivity.current = Date.now();
            setMessages((ms) => ms.map((m) => (m.id === message.id ? message : m)));
          },
          'message.hidden': ({ id }) => {
            lastActivity.current = Date.now();
            setMessages((ms) => ms.filter((m) => m.id !== id));
          },
          'screen.command': ({ command }) => {
            if (command === 'holding') setHolding(true);
            if (command === 'resume') setHolding(false);
            if (command === 'clear' || command === 'resetEvent') {
              queue.current = [];
              exitPresentMode();
              void resync();
            }
          },
          $resync: () => void resync(), // discard + refetch wholesale, never replay
        });
      } catch {
        // boot failure: the error boundary / watchdog path takes over
        setStale(true);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [exitPresentMode]);

  // Feature loop: queue head takes the stage for featureSeconds (5s when backed up)
  useEffect(() => {
    if (!config || !presenting || holding) return;

    const featureSeconds = () => (queue.current.length > 5 ? 5 : config.wall.featureSeconds);

    const advanceFeatured = () => {
      setFeatureVisible(false);
      clearFeatureFade();
      featureFadeTimer.current = setTimeout(() => {
        const next = queue.current.shift();
        if (!next) {
          featuredRef.current = null;
          setFeatured(null);
          setFeatureShell(false);
          featureFadeTimer.current = null;
          return;
        }

        featuredRef.current = next;
        setFeatureShell(true);
        setFeatured(next);
        featureFadeTimer.current = null;
        requestAnimationFrame(() => setFeatureVisible(true));
        featureFadeTimer.current = setTimeout(advanceFeatured, featureSeconds() * 1_000);
      }, FEATURE_FADE_MS);
    };

    const startFeatured = (next: Message) => {
      clearFeatureFade();
      featuredRef.current = next;
      setFeatureShell(true);
      setFeatured(next);
      featureFadeTimer.current = setTimeout(advanceFeatured, featureSeconds() * 1_000);
    };

    const tick = setInterval(() => {
      if (featuredRef.current || featureFadeTimer.current) return;
      const next = queue.current.shift();
      if (!next) return;
      startFeatured(next);
    }, 500);

    return () => {
      clearInterval(tick);
      clearFeatureFade();
    };
  }, [config, presenting, holding, clearFeatureFade]);

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

  // Grid rotation — starts only after Present
  useEffect(() => {
    if (!presenting || holding) return;
    const id = setInterval(() => setPointer((p) => p + 1), ROTATE_MS);
    return () => clearInterval(id);
  }, [presenting, holding]);

  // Smooth fade-in for the featured overlay
  useEffect(() => {
    if (!featured || !presenting || holding) {
      setFeatureVisible(false);
      return;
    }
    const frame = requestAnimationFrame(() => setFeatureVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [featured, presenting, holding]);

  // Watchdog: prolonged silence → discreet corner indicator, never a modal
  useEffect(() => {
    const id = setInterval(() => setStale(Date.now() - lastActivity.current > WATCHDOG_MS), 5_000);
    return () => clearInterval(id);
  }, []);

  const slots = config?.wall.slots ?? 14;

  const startPresent = () => {
    setPresenting(true);
    window.setTimeout(() => setShowPresentGate(false), PRESENT_FADE_MS);
  };

  return (
    <Stage>
      <div className="snd-grid relative h-full w-full bg-night">
        <WallFillBackdrop count={messages.length} />
        <SndPatternFrame className="relative z-10 flex h-full w-full flex-col bg-transparent p-10">
        <header className="mb-6 flex items-end justify-between gap-8">
          <div>
            <h1 className="font-display text-5xl text-sand">رسائل إلى الوطن</h1>
            <p className="mt-1 text-2xl opacity-60">Messages to the Nation · عزّنا بطبعنا</p>
          </div>
          <CoBrand tone="dark" className="mb-2 text-xl text-sand" />
        </header>
        <SatorpRule className="mb-8" />

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
          <div className="snd-grid absolute inset-0 z-40 flex flex-col items-center justify-center gap-10 bg-night">
            <SaduDivider />
            <h2 className="font-display text-7xl text-sand">اليوم الوطني السعودي ٩٦</h2>
            <p className="satorp-text-gradient text-3xl font-bold">SATORP · Saudi National Day 96</p>
            <SaduDivider />
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
            <div className="absolute inset-0 bg-night/55 backdrop-blur-[80px] backdrop-saturate-50" />
            <div className="absolute inset-0 bg-night/45 backdrop-blur-[48px]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-10">
              <div className="text-center">
                <p className="font-display text-5xl text-sand">رسائل إلى الوطن</p>
                <p className="mt-3 text-2xl text-sand/60">Messages to the Nation · عزّنا بطبعنا</p>
              </div>
              <Button
                className="min-h-[96px] rounded-2xl px-24 font-display text-5xl shadow-2xl ring-4 ring-sand/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                onClick={startPresent}
              >
                Present · عرض
              </Button>
              <p className="text-xl text-sand/45">Tap to begin the slideshow</p>
            </div>
          </div>
        )}

        {featureShell && presenting && !holding && (
          // Opaque shell stays up between messages — only content crossfades (spec §6)
          <div className="absolute inset-0 z-30 flex flex-col bg-sand p-20 text-snd-night">
            {featured && (
              <div
                className="flex h-full flex-col transition-opacity ease-in-out"
                style={{
                  opacity: featureVisible ? 1 : 0,
                  transitionDuration: `${FEATURE_FADE_MS}ms`,
                  willChange: 'opacity',
                }}
              >
                <div className="flex flex-1 flex-col justify-center">
                  <FitText
                    id={`feature-${featured.id}`}
                    text={featured.body}
                    min={48}
                    max={96}
                    className="max-h-[min(68vh,820px)] font-semibold"
                  />
                </div>
                <div className="mt-10 flex items-end justify-between gap-10">
                  <p className="user-text text-4xl opacity-70">
                    {featured.name}
                    {featured.department ? ` · ${featured.department}` : ''}
                  </p>
                  {/* inline SVG, not <img> — crisp at 75″ (spec §6) */}
                  <div className="h-28 w-64 shrink-0 opacity-80 [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: featured.signatureSvg }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Stage>
  );
}

function WallCard({ message, slotIndex }: { message: Message | null; slotIndex: number }) {
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
      <p className="user-text mt-2 truncate text-lg opacity-60 transition-opacity ease-in-out" style={{ transitionDuration: `${CARD_FADE_MS}ms`, opacity: visible ? 0.6 : 0 }}>
        {rendered.name}
      </p>
    </div>
  );
}
