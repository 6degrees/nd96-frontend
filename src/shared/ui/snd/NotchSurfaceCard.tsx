'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Ticket card — green body + cream device tag in the bottom cutout.
 * Tag width grows with the label. Inner scoop = tag border-radius over green rail.
 */
export function NotchSurfaceCard({
  href,
  title,
  description,
  device,
  icon,
  lang,
}: {
  href: string;
  title: string;
  description: string;
  device: string;
  icon: ReactNode;
  lang: 'ar' | 'en';
}) {
  return (
    <Link
      href={href}
      className="snd-ticket group outline-none focus-visible:ring-2 focus-visible:ring-saudi/55 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
    >
      <div className="snd-ticket__body">
        <div className="flex h-full min-h-[9.75rem] flex-col justify-between p-5 sm:min-h-[10.5rem] sm:p-6" dir={lang}>
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-display text-xl leading-snug text-sand sm:text-[1.35rem]">{title}</h3>
            {icon}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-sand/55">{description}</p>
        </div>
      </div>
      <div className="snd-ticket__rail">
        <span className="snd-ticket__tag">{device}</span>
        <span className="snd-ticket__rest" aria-hidden />
      </div>
    </Link>
  );
}
