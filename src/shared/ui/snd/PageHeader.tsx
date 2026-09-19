'use client';

import { CoBrand } from '@/shared/ui/Brand';
import { LangToggle } from '@/shared/ui/LangToggle';

/**
 * Shared dark-surface page header — matches Kings & Energy Journey.
 *
 * The header is intentionally hidden on small screens.
 * It is displayed from the lg breakpoint and above.
 */
export function PageHeader({title, subtitle, className}: { title: string; subtitle?: string; className?: string;}) {
    return (
        <header
            className={`
                relative z-10 hidden w-full items-start justify-between
                gap-[clamp(1rem,2vw,2rem)] lg:flex
                ${className ?? ''}
            `}>
            <div className="min-w-0 flex-1 pe-[clamp(1rem,2vw,2rem)]">
                <h1 className="font-display text-[clamp(2rem,min(3.5vw,6vh),3.5rem)] leading-[1.05] text-sand">
                    {title}
                </h1>

                {subtitle ? (
                    <p className="mt-2 text-[clamp(1rem,min(1.5vw,2.5vh),1.5rem)] leading-tight text-sand/60">
                        {subtitle}
                    </p>
                ) : null}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-[clamp(0.75rem,1.5vh,1rem)]">
                <LangToggle variant="segmented" tone="dark" />
            </div>
        </header>
    );
}