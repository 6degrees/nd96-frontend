'use client';

import { useI18n } from '@/shared/i18n';
import { CoBrand, SaduDivider } from '@/shared/ui/Brand';
import { LangToggle } from '@/shared/ui/LangToggle';
import { NotchSurfaceCard } from '@/shared/ui/snd/NotchSurfaceCard';
import { SaduSleepingLine, SndPatternFrame, WaveOverlay } from '@/shared/ui/snd/Decor';
import { SURFACE_ICONS, type SurfaceIconId } from '@/shared/ui/snd/SurfaceIcons';

// Dev launcher only — each kiosk opens its own route directly.
const SURFACE_IDS = {
  booth: true,
  wall: true,
  timeline: true,
  participation: true,
  console: true,
  highlights: true,
} as const;

const SURFACES: { href: string; id: keyof typeof SURFACE_IDS; icon: SurfaceIconId }[] = [
  { href: '/booth/message/', id: 'booth', icon: 'booth' },
  { href: '/wall/', id: 'wall', icon: 'wall' },
  { href: '/timeline/', id: 'timeline', icon: 'timeline' },
  { href: '/participation/', id: 'participation', icon: 'participation' },
  // operations console is deliberately unlisted — operators open /console/ directly
  { href: '/highlights/', id: 'highlights', icon: 'highlights' },
];

export default function Home() {
  const { t, lang } = useI18n();
  const mode = process.env.NEXT_PUBLIC_API_MODE ?? 'mock';
  const transport = process.env.NEXT_PUBLIC_TRANSPORT ?? 'poll';

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-night text-sand">
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/home/hero-backdrop.png"
          alt=""
          className="absolute left-1/2 top-1/2 h-[115%] w-[115%] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover blur-[6px] brightness-[0.55] saturate-[0.85]"
        />
        <div className="absolute inset-0 bg-night/55" />
        <div className="snd-grid absolute inset-0 opacity-40" />
      </div>
      <WaveOverlay className="relative z-[1] opacity-40" />
      <LangToggle variant="segmented" fixed tone="dark" />

      <SndPatternFrame className="relative z-10 min-h-[100dvh]" side={false} bottom={false}>
        <div className="relative mx-auto flex min-h-[100dvh] max-w-4xl flex-col items-center px-5 py-8 sm:px-8 sm:py-10">
          <header className="flex w-full max-w-2xl flex-col items-center text-center">
            <CoBrand tone="dark" divider={false} logoHeight={64} className="mb-5 gap-6 sm:gap-10" />
            <SaduSleepingLine className="mb-6 w-full max-w-lg" />

            <p className="font-display text-2xl leading-snug text-snd-bright sm:text-3xl">{t('home.headline')}</p>
            <h1 className="font-display mt-2 text-[1.65rem] leading-tight text-sand sm:text-4xl">
              {t('home.title')}
              <span className="mt-1 block text-2xl text-sand/75 sm:text-3xl">{t('home.subtitle')}</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-sand/50">{t('home.devNote')}</p>
          </header>

          <section className="flex w-full max-w-3xl flex-1 flex-col items-center">
            <div className="mb-5 flex w-full items-center justify-center gap-3">
              <h2 className="font-display text-xl text-sand sm:text-2xl">{t('home.surfacesHeading')}</h2>
              <span className="font-mono text-xs text-sand/35">
                {SURFACES.length} {t('home.routes')}
              </span>
            </div>

            <ul className="grid w-full gap-5 sm:grid-cols-2 sm:gap-6">
              {SURFACES.map(({ href, id, icon }, i) => {
                const Icon = SURFACE_ICONS[icon];
                return (
                  <li
                    key={href}
                    className={
                      i === SURFACES.length - 1 && SURFACES.length % 2 === 1
                        ? 'sm:col-span-2 sm:max-w-md sm:justify-self-center sm:w-full'
                        : undefined
                    }
                  >
                    <NotchSurfaceCard
                      href={href}
                      lang={lang}
                      title={t(`home.surfaces.${id}.name`)}
                      description={t(`home.surfaces.${id}.description`)}
                      device={t(`home.surfaces.${id}.device`)}
                      icon={
                        <Icon className="h-11 w-11 shrink-0 text-sand/85 transition duration-200 group-hover:text-snd-bright sm:h-12 sm:w-12" />
                      }
                    />
                  </li>
                );
              })}
            </ul>
          </section>

          <footer className="mt-10 w-full max-w-3xl border-t border-white/10 pt-8">
            <SaduDivider className="mb-6" />
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-sand/40">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono">mode: {mode}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono">transport: {transport}</span>
              <span className="font-mono text-sand/30">{t('home.devLauncher')}</span>
            </div>
          </footer>
        </div>
      </SndPatternFrame>
    </main>
  );
}
