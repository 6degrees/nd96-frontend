'use client';

import { useI18n } from '@/shared/i18n';
import { Button } from './Button';

export function LangToggle({ className }: { className?: string }) {
  const { t, toggle } = useI18n();
  return (
    <Button variant="secondary" className={className} onClick={toggle} aria-label="Switch language">
      {t('common.langSwitch')}
    </Button>
  );
}
