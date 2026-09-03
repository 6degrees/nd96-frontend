'use client';

import { CoBrand } from '@/shared/ui/Brand';
import { LangToggle } from '@/shared/ui/LangToggle';

/**
 * Shared dark-surface page header — matches Kings & Energy Journey.
 * Title + subtitle left; segmented lang toggle + CoBrand stacked right.
 */
export function PageHeader({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <header className={`relative z-10 mb-6 flex items-start justify-between gap-6 ${className ?? ''}`}>
      <div className="min-w-0 flex-1 pe-6">
        <h1 className="font-display text-5xl text-sand">{title}</h1>
        {subtitle ? <p className="mt-1 text-2xl text-sand/60">{subtitle}</p> : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-4">
        <LangToggle variant="segmented" tone="dark" />
        <CoBrand tone="dark" className="text-sand" logoHeight={48} divider={false} />
      </div>
    </header>
  );
}
