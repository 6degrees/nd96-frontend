import Link from 'next/link';
import { CoBrand, SaduDivider, SatorpRule } from '@/shared/ui/Brand';
import { SaduSleepingLine, SndPatternFrame, WaveOverlay } from '@/shared/ui/snd/Decor';
import { SURFACE_ICONS, type SurfaceIconId } from '@/shared/ui/snd/SurfaceIcons';

// Dev launcher only — each kiosk opens its own route directly.
const SURFACES: {
  href: string;
  name: string;
  nameAr: string;
  device: string;
  icon: SurfaceIconId;
}[] = [
  { href: '/booth/message/', name: 'Message booth', nameAr: 'كشك الرسائل', device: 'iPad · Guided Access', icon: 'booth' },
  { href: '/wall/', name: 'Message wall', nameAr: 'جدار الرسائل', device: '75″ screen · 1920×1080', icon: 'wall' },
  { href: '/timeline/', name: 'Kings & Energy Journey', nameAr: 'مسيرة الملوك والطاقة', device: 'Touch screen', icon: 'timeline' },
  { href: '/participation/', name: 'Participation view', nameAr: 'شاشة المشاركة', device: 'Secondary screen', icon: 'participation' },
  { href: '/console/', name: 'Operations console', nameAr: 'لوحة التشغيل', device: 'Laptop or tablet', icon: 'console' },
  { href: '/highlights/', name: 'Highlights page', nameAr: 'أبرز اللحظات', device: 'Web · post-event', icon: 'highlights' },
];

export default function Home() {
  const mode = process.env.NEXT_PUBLIC_API_MODE ?? 'mock';
  const transport = process.env.NEXT_PUBLIC_TRANSPORT ?? 'poll';

  return (
    <main className="snd-grid relative min-h-[100dvh] overflow-x-hidden bg-night text-sand">
      <WaveOverlay className="opacity-60" />

      <SndPatternFrame className="min-h-[100dvh]" side={false}>
        <div className="mx-auto flex min-h-[100dvh] max-w-4xl flex-col items-center px-5 py-8 sm:px-8 sm:py-10">
          <header className="flex w-full max-w-2xl flex-col items-center text-center">
            <CoBrand tone="dark" divider={false} logoHeight={64} className="mb-5 gap-6 sm:gap-10" />
            <SaduSleepingLine className="mb-6 w-full max-w-lg" />

            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-snd-bright/75">
              Brand Guidelines · Saudi National Day
            </p>

            <p className="font-display text-2xl leading-snug text-snd-bright sm:text-3xl">اليوم الوطني السعودي ٩٦</p>
            <h1 className="font-display mt-2 text-[1.65rem] leading-tight text-sand sm:text-4xl">
              SATORP · ND96
              <span className="mt-1 block text-2xl text-sand/75 sm:text-3xl">Event Surfaces</span>
            </h1>
            <SatorpRule className="mt-6 w-full max-w-[220px]" />
            <p className="mt-5 max-w-md text-sm leading-relaxed text-sand/50">
              واجهة التطوير — كل شاشة تفتح مسارها مباشرة في الإنتاج
            </p>
          </header>

          <section className="flex w-full max-w-3xl flex-1 flex-col items-center">
            <div className="mb-5 flex w-full items-center justify-center gap-3">
              <h2 className="font-display text-xl text-sand sm:text-2xl">الشاشات</h2>
              <span className="font-mono text-xs text-sand/35">{SURFACES.length} routes</span>
            </div>

            <ul className="grid w-full gap-4 sm:grid-cols-2 sm:gap-5">
              {SURFACES.map(({ href, name, nameAr, device, icon }, i) => {
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
                    <Link
                      href={href}
                      className="group flex min-h-[148px] flex-col justify-between rounded-2xl border border-saudi/20 bg-snd-grid p-5 transition duration-200 hover:border-saudi/50 hover:bg-[#173f33] sm:min-h-[160px] sm:p-6"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-display text-xl leading-snug text-sand sm:text-[1.35rem]">{nameAr}</h3>
                        <Icon className="h-11 w-11 shrink-0 text-sand/85 transition duration-200 group-hover:text-snd-bright sm:h-12 sm:w-12" />
                      </div>

                      <div className="mt-6">
                        <p className="text-sm leading-relaxed text-sand/55">{name}</p>
                        <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-sand/40">{device}</p>
                      </div>
                    </Link>
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
              <span className="font-mono text-sand/30">dev launcher</span>
            </div>
          </footer>
        </div>
      </SndPatternFrame>
    </main>
  );
}
