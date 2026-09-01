'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/shared/api/client';
import type { EventConfig, Message } from '@/shared/api/types';
import { FitText } from '@/shared/stage/FitText';
import { Stage } from '@/shared/stage/Stage';
import { createTransport } from '@/shared/transport';
import { CoBrand, SaduDivider, SatorpRule } from '@/shared/ui/Brand';

// The message wall (spec §6). Two decisions carry twelve unattended hours:
//
// 1. CONSTANT DOM — a fixed pool of card slots with stable keys. Content
//    rotates through the slots; nodes are never appended, so the heap stays
//    flat whether 30 or 900 messages have been submitted.
// 2. QUEUE, NEVER DROP — every contributor sees their own words featured.
//    Over five queued → shorten the feature to 5s rather than skipping.

const ROTATE_MS = 4_000;
const WATCHDOG_MS = 60_000;

export default function WallPage() {
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]); // newest first
  const [featured, setFeatured] = useState<Message | null>(null);
  const [pointer, setPointer] = useState(0);
  const [stale, setStale] = useState(false);
  const [holding, setHolding] = useState(false);

  const queue = useRef<Message[]>([]);
  const featuredRef = useRef<Message | null>(null);
  const seen = useRef(new Set<string>());
  const lastActivity = useRef(Date.now());

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
  }, []);

  // Feature loop: queue head takes the stage for featureSeconds (5s when backed up)
  useEffect(() => {
    if (!config) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const tick = setInterval(() => {
      if (featuredRef.current) return;
      const next = queue.current.shift();
      if (!next) return;
      featuredRef.current = next;
      setFeatured(next);
      const seconds = queue.current.length > 5 ? 5 : config.wall.featureSeconds;
      timers.push(
        setTimeout(() => {
          featuredRef.current = null;
          setFeatured(null);
        }, seconds * 1_000),
      );
    }, 500);
    return () => {
      clearInterval(tick);
      timers.forEach(clearTimeout);
    };
  }, [config]);

  // Grid rotation
  useEffect(() => {
    const id = setInterval(() => setPointer((p) => p + 1), ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  // Watchdog: prolonged silence → discreet corner indicator, never a modal
  useEffect(() => {
    const id = setInterval(() => setStale(Date.now() - lastActivity.current > WATCHDOG_MS), 5_000);
    return () => clearInterval(id);
  }, []);

  const slots = config?.wall.slots ?? 14;

  return (
    <Stage>
      <div className="snd-grid flex h-full w-full flex-col bg-night p-10">
        <header className="mb-6 flex items-end justify-between gap-8">
          <div>
            <h1 className="font-display text-5xl text-sand">رسائل إلى الوطن</h1>
            <p className="mt-1 text-2xl opacity-60">Messages to the Nation · عزّنا بطبعنا</p>
          </div>
          <CoBrand tone="dark" className="mb-2 text-xl text-sand" />
        </header>
        <SatorpRule className="mb-8" />

        {/* fixed slot pool — keys slot-0…slot-N are stable for 12 hours */}
        <div className="grid flex-1 grid-cols-5 grid-rows-3 gap-5" style={{ opacity: holding ? 0 : 1, transition: 'opacity 400ms' }}>
          {Array.from({ length: slots }, (_, i) => {
            const msg = messages.length > 0 ? messages[(pointer + i) % messages.length] : null;
            return <WallCard key={`slot-${i}`} message={msg} />;
          })}
        </div>

        {featured && !holding && (
          // single feature overlay — the only element with will-change
          <div
            className="absolute inset-0 flex items-center justify-center bg-night/90"
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="max-w-4xl rounded-3xl border-8 border-saudi/40 bg-sand p-16 text-snd-night shadow-2xl">
              <FitText id={`feature-${featured.id}`} text={featured.body} min={40} max={72} className="max-h-[400px] font-semibold" />
              <div className="mt-8 flex items-end justify-between gap-8">
                <p className="user-text text-3xl opacity-70">
                  {featured.name}
                  {featured.department ? ` · ${featured.department}` : ''}
                </p>
                {/* inline SVG, not <img> — crisp at 75″ (spec §6) */}
                <div className="h-24 w-56 opacity-80 [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: featured.signatureSvg }} />
              </div>
            </div>
          </div>
        )}

        {holding && (
          <div className="snd-grid absolute inset-0 flex flex-col items-center justify-center gap-10 bg-night">
            <SaduDivider />
            <h2 className="font-display text-7xl text-sand">اليوم الوطني السعودي ٩٦</h2>
            <p className="satorp-text-gradient text-3xl font-bold">SATORP · Saudi National Day 96</p>
            <SaduDivider />
          </div>
        )}

        {stale && <div className="absolute bottom-4 end-4 h-3 w-3 rounded-full bg-amber-500" title="degraded" />}
      </div>
    </Stage>
  );
}

function WallCard({ message }: { message: Message | null }) {
  if (!message) return <div className="rounded-2xl bg-white/5" />;
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white/10 p-5" style={{ transition: 'opacity 600ms' }}>
      <FitText id={message.id} text={message.body} min={20} max={34} className="flex-1" />
      <p className="user-text mt-2 truncate text-lg opacity-60">{message.name}</p>
    </div>
  );
}
