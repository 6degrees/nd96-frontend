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
| Displays the language selector with a fixed language order.
|
*/
function SlidingLangToggle({ tone }: { tone: 'dark' | 'light' }) {
    const { lang, setLang } = useI18n();

    /*
    |--------------------------------------------------------------------------
    | Toggle Shell
    |--------------------------------------------------------------------------
    |
    | Sets the selector appearance based on the selected tone.
    |
    */
    const shell = tone === 'light' ? 'border border-snd-night/15 bg-white/95 shadow-lg backdrop-blur-sm' : 'border border-white/15 bg-night/85 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md';

    /*
    |--------------------------------------------------------------------------
    | Active Indicator
    |--------------------------------------------------------------------------
    |
    | Sets the active language background based on the selected tone.
    |
    */
    const thumb = tone === 'light' ? 'bg-snd-night shadow-sm' : 'bg-saudi shadow-[0_0_16px_rgba(14,138,70,0.35)]';

    return (
        <div role="group" aria-label="Language" dir="ltr" className={`relative w-[8.5rem] rounded-full p-1 ${shell}`}>
            {/*
      |--------------------------------------------------------------------------
      | Active Language Indicator
      |--------------------------------------------------------------------------
      |
      | Moves behind the currently active language.
      |
      */}
            <span aria-hidden className={`absolute inset-y-1 w-[calc(50%-0.3rem)] rounded-full transition-[left] duration-200 ease-out ${thumb} ${lang === 'ar' ? 'left-1' : 'right-1'}`} />

            {/*
      |--------------------------------------------------------------------------
      | Language Options
      |--------------------------------------------------------------------------
      |
      | Keeps Arabic on the left and English on the right.
      |
      */}
            <div className="relative z-10 grid grid-cols-2">
                {SEGMENTS.map(({ lang: code, label }) => (
                    <button key={code} type="button" aria-pressed={lang === code} onClick={() => setLang(code)} className={`min-h-[40px] rounded-full text-sm font-semibold transition-colors ${lang === code ? 'text-white' : tone === 'light' ? 'text-snd-night/50 hover:text-snd-night/80' : 'text-sand/50 hover:text-sand/80'}`}>
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
export function LangToggle({className, tone = 'dark', variant = 'button', fixed = false, placement = 'inline',}: {
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
    |
    | Keeps the legacy fixed prop compatible with the placement option.
    |
    */
    const resolvedPlacement = fixed ? 'fixed' : placement;

    /*
    |--------------------------------------------------------------------------
    | Language Content
    |--------------------------------------------------------------------------
    |
    | Renders the selected language toggle variant.
    |
    */
    const content = variant === 'segmented' ? (
        <SlidingLangToggle tone={tone} />
    ) : (
        <Button variant="secondary" className={tone === 'light' ? 'border border-snd-night/15 bg-white text-snd-night shadow-sm active:bg-sand' : 'bg-white/10 text-current active:bg-white/20'} onClick={toggle} aria-label="Switch language">
            {t('common.langSwitch')}
        </Button>
    );

    /*
    |--------------------------------------------------------------------------
    | Fixed Placement
    |--------------------------------------------------------------------------
    |
    | Positions the language selector relative to the viewport.
    |
    */
    if (resolvedPlacement === 'fixed') {
        return (
            <div className={`fixed z-50 top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] ${className ?? ''}`} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                {content}
            </div>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Stage Placement
    |--------------------------------------------------------------------------
    |
    | Positions the language selector inside the presentation stage.
    |
    */
    if (resolvedPlacement === 'stage') {
        return (
            <div className={`pointer-events-auto absolute top-8 z-50 end-8 ${className ?? ''}`} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                {content}
            </div>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Inline Placement
    |--------------------------------------------------------------------------
    |
    | Renders the language selector in its normal document position.
    |
    */
    return <div className={className}>{content}</div>;
}