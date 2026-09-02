'use client';

import { useI18n } from '@/shared/i18n';
import { Button } from './Button';

export function LangToggle({ className, tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  const { t, toggle } = useI18n();
  const surface =
    tone === 'light'
      ? 'border border-snd-night/15 bg-white text-snd-night shadow-sm active:bg-sand'
      : 'bg-white/10 text-current active:bg-white/20';
  return (
    <Button variant="secondary" className={`${surface} ${className ?? ''}`} onClick={toggle} aria-label="Switch language">
      {t('common.langSwitch')}
    </Button>
  );
}
