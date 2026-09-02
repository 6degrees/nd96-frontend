'use client';

import type { Lang } from '@/shared/api/types';
import { useI18n } from '@/shared/i18n';
import { Button } from './Button';

const SEGMENTS: { lang: Lang; label: string }[] = [
  { lang: 'en', label: 'EN' },
  { lang: 'ar', label: 'عربي' },
];

function SlidingLangToggle({ tone }: { tone: 'dark' | 'light' }) {
  const { lang, setLang } = useI18n();

  const shell =
    tone === 'light'
      ? 'border border-snd-night/15 bg-white/95 shadow-lg backdrop-blur-sm'
      : 'border border-white/15 bg-night/85 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md';

  const thumb =
    tone === 'light'
      ? 'bg-snd-night shadow-sm'
      : 'bg-saudi shadow-[0_0_16px_rgba(14,138,70,0.35)]';

  return (
    <div
      role="group"
      aria-label="Language"
      className={`relative w-[8.5rem] rounded-full p-1 ${shell}`}
    >
      <span
        aria-hidden
        className={`absolute inset-y-1 w-[calc(50%-0.3rem)] rounded-full transition-[left] duration-200 ease-out ${thumb} ${
          lang === 'ar' ? 'left-[calc(50%+0.15rem)]' : 'left-1'
        }`}
      />
      <div className="relative z-10 grid grid-cols-2">
        {SEGMENTS.map(({ lang: code, label }) => (
          <button
            key={code}
            type="button"
            aria-pressed={lang === code}
            onClick={() => setLang(code)}
            className={`min-h-[40px] rounded-full text-sm font-semibold transition-colors ${
              lang === code
                ? 'text-white'
                : tone === 'light'
                  ? 'text-snd-night/50 hover:text-snd-night/80'
                  : 'text-sand/50 hover:text-sand/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function LangToggle({
  className,
  tone = 'dark',
  variant = 'button',
  fixed = false,
}: {
  className?: string;
  tone?: 'dark' | 'light';
  variant?: 'button' | 'segmented';
  fixed?: boolean;
}) {
  const { t, toggle } = useI18n();

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

  if (fixed) {
    return (
      <div
        className={`fixed z-50 top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] ${className ?? ''}`}
      >
        {content}
      </div>
    );
  }

  return <div className={className}>{content}</div>;
}
