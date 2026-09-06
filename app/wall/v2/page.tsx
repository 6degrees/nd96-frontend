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
import { SignatureMark } from '@/shared/ui/SignatureMark';

// Wall v2 — monument-hero collective fill (no featured slideshow).
// Dense fixed slot pool: constant DOM for long unattended runs.

const ROTATE_MS = 5_500;
const WATCHDOG_MS = 60_000;
const PRESENT_FADE_MS = 800;
const CARD_FADE_MS = 480;
const CARD_STAGGER_MS = 36;
const MOSAIC_SLOTS = 24; // 6×4 denser backdrop

export default function WallV2Page() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]); // newest first
  const [pointer, setPointer] = useState(0);
  const [stale, setStale] = useState(false);
  const [holding, setHolding] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [showPresentGate, setShowPresentGate] = useState(true);

  const seen = useRef(new Set<string>());
  const lastActivity = useRef(Date.now());

  const exitPresentMode = useCallback(() => {
    setPresenting(false);
    setShowPresentGate(true);
  }, []);

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
    };
  }, [exitPresentMode]);

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
    if (!presenting || holding) return;
    const id = setInterval(() => setPointer((p) => p + 1), ROTATE_MS);
    return () => clearInterval(id);
  }, [presenting, holding]);

  useEffect(() => {
    const id = setInterval(() => setStale(Date.now() - lastActivity.current > WATCHDOG_MS), 5_000);
    return () => clearInterval(id);
  }, []);

  const startPresent = () => {
    setPresenting(true);
    window.setTimeout(() => setShowPresentGate(false), PRESENT_FADE_MS);
  };

  return (
    <Stage fit="cover">
      <div className="snd-grid relative h-full w-full bg-night">
        <WaveOverlay className="pointer-events-none opacity-30" />

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

          {/* Dense mosaic backdrop — fixed slot pool */}
          <div
            className="relative grid min-h-0 flex-1 grid-cols-6 grid-rows-4 gap-3 transition-opacity duration-700 ease-out"
            style={{ opacity: holding ? 0 : presenting ? 0.88 : 0.55 }}
          >
            {Array.from({ length: MOSAIC_SLOTS }, (_, i) => {
              const msg = messages.length > 0 ? messages[(pointer + i) % messages.length] : null;
              return <MosaicCard key={`slot-${i}`} slotIndex={i} message={msg} />;
            })}
          </div>

          {/* Bottom wash — keeps mosaic from bleeding under the dock */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-[34%] bg-gradient-to-t from-night via-night/75 to-transparent"
          />

          {/* Monument + flipper dock — bottom center */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center transition-opacity duration-700"
            style={{ opacity: holding ? 0 : presenting ? 1 : 0.35 }}
          >
            <MonumentProgress count={messages.length} />
          </div>

          {stale && (
            <div className="absolute bottom-4 end-4 z-40 h-3 w-3 rounded-full bg-amber-500" title="degraded" />
          )}
        </SndPatternFrame>

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
    return <div className="rounded-xl bg-white/[0.04]" />;
  }

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl bg-white/[0.08] px-3 py-2.5 transition-[opacity,transform] ease-in-out"
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
