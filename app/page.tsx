import Link from 'next/link';

// Dev launcher only — each kiosk opens its own route directly.
const SURFACES = [
  ['/booth/message/', 'Message booth', 'iPad, Guided Access'],
  ['/wall/', 'Message wall', '75″ screen, 1920×1080'],
  ['/timeline/', 'Kings & Energy Journey', 'Touch screen'],
  ['/participation/', 'Participation view', 'Secondary screen'],
  ['/console/', 'Operations console', 'Laptop or tablet'],
  ['/highlights/', 'Highlights page', 'Web, post-event'],
] as const;

export default function Home() {
  return (
    <main className="snd-grid mx-auto min-h-[100dvh] max-w-2xl p-10">
      <h1 className="font-display mb-1 text-3xl text-sand">ND96 — Saudi National Day 96</h1>
      <p className="mb-1 opacity-70">ساتورب satorp · اليوم الوطني السعودي ٩٦</p>
      <p className="mb-8 opacity-70">
        Surface launcher (dev only). Mode: <code>{process.env.NEXT_PUBLIC_API_MODE}</code> · transport:{' '}
        <code>{process.env.NEXT_PUBLIC_TRANSPORT}</code>
      </p>
      <ul className="space-y-3">
        {SURFACES.map(([href, name, device]) => (
          <li key={href}>
            <Link href={href} className="block rounded-xl bg-white/5 p-4 hover:bg-white/10">
              <span className="font-semibold">{name}</span>
              <span className="ms-3 text-sm opacity-60">{device}</span>
              <span className="ms-3 font-mono text-sm opacity-40">{href}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
