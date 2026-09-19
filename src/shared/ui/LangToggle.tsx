'use client';

import type { Lang } from '@/shared/api/types';
import { useI18n } from '@/shared/i18n';
import { Button } from './Button';

/*
|--------------------------------------------------------------------------
| Language Segments
|--------------------------------------------------------------------------
|
| Defines the available application languages.
|
*/
const SEGMENTS: { lang: Lang; label: string }[] = [
    { lang: 'ar', label: 'عربي' },
    { lang: 'en', label: 'EN' },
];

/*
|--------------------------------------------------------------------------
| Sliding Language Toggle
|--------------------------------------------------------------------------
|
| Displays the language selector with a fixed size.
|
*/
function SlidingLangToggle({ tone }: { tone: 'dark' | 'light' }) {
    const { lang, setLang } = useI18n();

    /*
    |--------------------------------------------------------------------------
    | Toggle Shell
    |--------------------------------------------------------------------------
    */
    const shell =
        tone === 'light'
            ? 'border border-snd-night/15 bg-white/95 shadow-lg backdrop-blur-sm'
            : 'border border-white/15 bg-night/85 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md';

    /*
    |--------------------------------------------------------------------------
    | Active Indicator
    |--------------------------------------------------------------------------
    */
    const thumb =
        tone === 'light'
            ? 'bg-snd-night shadow-sm'
            : 'bg-saudi shadow-[0_0_16px_rgba(14,138,70,0.35)]';

    return (
        <div
            role="group"
            aria-label="Language"
            dir="ltr"
            className={`
                relative
                h-[44px]
                w-[112px]
                rounded-full
                p-1
                ${shell}
            `}
        >
            {/* Active language indicator */}
            <span
                aria-hidden
                className={`
                    absolute
                    inset-y-1
                    w-[calc(50%-0.3rem)]
                    rounded-full
                    transition-[left,right]
                    duration-200
                    ease-out
                    ${thumb}
                    ${
                    lang === 'ar'
                        ? 'left-1 right-auto'
                        : 'left-auto right-1'
                }
                `}
            />

            {/* Language options */}
            <div className="relative z-10 grid h-full grid-cols-2">
                {SEGMENTS.map(({ lang: code, label }) => (
                    <button
                        key={code}
                        type="button"
                        aria-pressed={lang === code}
                        onClick={() => setLang(code)}
                        className={`
                            flex
                            h-full
                            items-center
                            justify-center
                            rounded-full
                            text-sm
                            font-semibold
                            transition-colors
                            ${
                            lang === code
                                ? 'text-white'
                                : tone === 'light'
                                    ? 'text-snd-night/50 hover:text-snd-night/80'
                                    : 'text-sand/50 hover:text-sand/80'
                        }
                        `}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Language Toggle
|--------------------------------------------------------------------------
|
| Provides the language switcher in button or segmented mode.
|
*/
export function LangToggle({
                               className,
                               tone = 'dark',
                               variant = 'button',
                               fixed = false,
                               placement = 'inline',
                           }: {
    className?: string;
    tone?: 'dark' | 'light';
    variant?: 'button' | 'segmented';

    /** @deprecated Use placement="fixed" */
    fixed?: boolean;

    placement?: 'inline' | 'fixed' | 'stage';
}) {
    const { t, toggle } = useI18n();

    /*
    |--------------------------------------------------------------------------
    | Resolve Placement
    |--------------------------------------------------------------------------
    */
    const resolvedPlacement = fixed ? 'fixed' : placement;

    /*
    |--------------------------------------------------------------------------
    | Language Content
    |--------------------------------------------------------------------------
    */
    const content =
        variant === 'segmented' ? (
            <SlidingLangToggle tone={tone} />
        ) : (
            <Button
                variant="secondary"
                className={
                    tone === 'light'
                        ? 'border border-snd-night/15 bg-white text-snd-night shadow-sm active:bg-sand'
                        : 'bg-white/10 text-current active:bg-white/20'
                }
                onClick={toggle}
                aria-label="Switch language"
            >
                {t('common.langSwitch')}
            </Button>
        );

    /*
    |--------------------------------------------------------------------------
    | Fixed Placement
    |--------------------------------------------------------------------------
    */
    if (resolvedPlacement === 'fixed') {
        return (
            <div
                className={`
                    fixed
                    right-[max(1rem,env(safe-area-inset-right))]
                    top-[max(1rem,env(safe-area-inset-top))]
                    z-50
                    ${className ?? ''}
                `}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                {content}
            </div>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Stage Placement
    |--------------------------------------------------------------------------
    */
    if (resolvedPlacement === 'stage') {
        return (
            <div
                className={`
                    pointer-events-auto
                    absolute
                    end-8
                    top-8
                    z-50
                    ${className ?? ''}
                `}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                {content}
            </div>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Inline Placement
    |--------------------------------------------------------------------------
    */
    return <div className={className}>{content}</div>;
}