'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiError, api } from '@/shared/api/client';
import type { EventConfig } from '@/shared/api/types';
import { useI18n } from '@/shared/i18n';
import { CoBrand, SatorpRule, SndLogo } from '@/shared/ui/Brand';
import { Button } from '@/shared/ui/Button';
import { LangToggle } from '@/shared/ui/LangToggle';
import { SignatureField, type SignatureHandle } from '@/shared/ui/SignatureField';
import { WaveOverlay, SndPatternFrame } from '@/shared/ui/snd/Decor';
import { validateBody, validateName, validateSignature } from '@/shared/validation';

type Status = 'idle' | 'submitting' | 'sent' | 'error';

const fieldClass =
  'user-text w-full rounded-xl border-2 border-snd-night/12 bg-white px-4 py-3.5 text-xl text-snd-night outline-none transition focus:border-saudi focus:ring-2 focus:ring-saudi/20';

// Three steps on one screen — message, name, signature — not a wizard.
// Every extra tap loses participants (spec §6).
export default function BoothPage() {
  const { t, lang, setLang } = useI18n();
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [resetCountdown, setResetCountdown] = useState(6);
  const signature = useRef<SignatureHandle>(null);
  const clientRef = useRef<string>('');

  useEffect(() => {
    api.getConfig().then(setConfig).catch(() => setError(t('booth.retry')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const limits = config?.limits ?? { nameMax: 40, bodyMax: 180, photoMaxBytes: 0 };
  const charsLeft = limits.bodyMax - body.length;
  const charProgress = Math.min(100, (body.length / limits.bodyMax) * 100);
  const charWarn = charsLeft <= 20;

  const clearError = () => {
    if (error) setError(null);
    if (status === 'error') setStatus('idle');
  };

  const reset = () => {
    setName('');
    setDepartment('');
    setBody('');
    setError(null);
    setStatus('idle');
    signature.current?.clear();
    clientRef.current = '';
    setLang(config?.defaultLanguage ?? 'ar');
  };

  useEffect(() => {
    if (status !== 'sent') return;
    setResetCountdown(6);
    const tick = setInterval(() => {
      setResetCountdown((n) => (n > 0 ? n - 1 : 0));
    }, 1_000);
    const id = setTimeout(reset, 6_000);
    return () => {
      clearInterval(tick);
      clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const submit = async () => {
    if (status === 'submitting') return;
    const sig = signature.current;
    const validationError =
      validateName(name, limits) ??
      validateBody(body, limits) ??
      validateSignature(sig?.pointCount() ?? 0, sig?.isEmpty() ?? true);
    if (validationError) {
      setError(t(validationError));
      return;
    }

    if (!clientRef.current) clientRef.current = crypto.randomUUID();
    setStatus('submitting');
    setError(null);
    try {
      await api.postMessage({
        clientRef: clientRef.current,
        name: name.trim(),
        department: department || undefined,
        body: body.trim(),
        language: lang,
        signatureSvg: sig!.toSVG(),
        signaturePng: sig!.toPNG(),
      });
      setStatus('sent');
    } catch (e) {
      setStatus('error');
      if (e instanceof ApiError && e.code === 'CONTENT_REJECTED' && e.localized) {
        setError(e.localized[lang]);
        clientRef.current = '';
      } else if (e instanceof ApiError && e.errors) {
        setError(Object.values(e.errors).flat()[0] ?? t('booth.retry'));
        clientRef.current = '';
      } else {
        setError(t('booth.retry'));
      }
    }
  };

  if (status === 'sent') {
    return (
      <main className="snd-grid relative flex min-h-[100dvh] items-center justify-center bg-night px-4 py-6 sm:px-6">
        <WaveOverlay className="pointer-events-none opacity-60" />

        <SndPatternFrame className="w-full max-w-xl" side={false} bottom={false}>
          <div
            className="relative z-10 mx-auto flex w-full flex-col rounded-2xl bg-sand text-snd-night shadow-[0_0_80px_rgba(0,0,0,0.35)]"
            style={{
              paddingTop: 'max(0px, env(safe-area-inset-top))',
              paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
            }}
          >
            <div aria-hidden className="snd-checker h-4 w-full" />
            <div aria-hidden className="snd-pattern-sleeping-line h-2.5 w-full" />

            <div className="flex flex-col items-center px-6 py-10 text-center sm:px-10 sm:py-12">
              <SndLogo height={56} className="mb-8" />

              <div
                aria-hidden
                className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-saudi shadow-[0_8px_32px_rgba(14,138,70,0.35)]"
              >
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-white">
                  <path
                    d="M10 20.5 17 27.5 30 13.5"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h1 className="font-display text-4xl leading-tight text-snd-night sm:text-5xl">{t('booth.sentTitle')}</h1>
              <p className="user-text mt-4 max-w-sm text-xl leading-relaxed text-snd-night/75">{t('booth.sent')}</p>
              <p className="mt-3 max-w-sm text-base text-snd-night/55">{t('booth.sentHint')}</p>

              <SatorpRule className="mt-8 w-full max-w-[200px]" />

              <div className="mt-8 w-full max-w-xs">
                <p className="mb-2 font-mono text-sm text-snd-night/45">
                  {t('booth.sentReset')} {resetCountdown}s
                </p>
                <div className="h-1.5 overflow-hidden rounded-full bg-snd-night/10">
                  <div
                    className="h-full rounded-full bg-saudi transition-[width] duration-1000 ease-linear"
                    style={{ width: `${(resetCountdown / 6) * 100}%` }}
                  />
                </div>
              </div>

              <footer className="mt-10 w-full border-t border-snd-night/10 pt-8">
                <CoBrand tone="light" className="justify-center text-snd-night/70" />
              </footer>
            </div>

            <div aria-hidden className="snd-pattern-sleeping-line h-2.5 w-full" />
            <div aria-hidden className="snd-checker h-4 w-full" />
          </div>
        </SndPatternFrame>
      </main>
    );
  }

  return (
    <main className="snd-grid relative flex min-h-[100dvh] items-center justify-center bg-night px-4 py-6 sm:px-6">
      <SndPatternFrame className="w-full max-w-xl" side={false} bottom={false}>
        <WaveOverlay className="pointer-events-none opacity-60" />

      {/* Cream card — SND celebration surface */}
      <div
        className="relative z-10 mx-auto flex w-full flex-col rounded-2xl bg-sand text-snd-night shadow-[0_0_80px_rgba(0,0,0,0.35)]"
        style={{
          paddingTop: 'max(0px, env(safe-area-inset-top))',
          paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
        }}
      >
        <div aria-hidden className="snd-checker h-4 w-full" />
        <div aria-hidden className="snd-pattern-sleeping-line h-2.5 w-full" />

        <div className="flex flex-1 flex-col gap-6 px-6 py-6 sm:px-8 sm:py-8">
          <header className="flex items-start justify-between gap-4 border-b border-snd-night/10 pb-6">
            <div className="min-w-0 flex-1">
              <SndLogo height={52} className="mb-4 max-w-full" />
              <h1 className="font-display text-3xl leading-tight">{t('booth.title')}</h1>
              <p className="mt-2 text-lg text-snd-night/65">{t('booth.subtitle')}</p>
              <SatorpRule className="mt-4 max-w-xs" />
            </div>
            <LangToggle tone="light" className="min-h-[52px] shrink-0 px-5 text-base" />
          </header>

          <label className="block">
            <span className="mb-2 block font-display text-lg">{t('booth.messageLabel')}</span>
            <textarea
              className={`${fieldClass} min-h-[9rem] resize-none`}
              value={body}
              maxLength={limits.bodyMax}
              placeholder={t('booth.messagePlaceholder')}
              onChange={(e) => {
                setBody(e.target.value);
                clearError();
              }}
            />
            <div className="mt-2 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-snd-night/10">
                <div
                  className={`h-full rounded-full transition-all ${charWarn ? 'bg-amber-500' : 'bg-saudi'}`}
                  style={{ width: `${charProgress}%` }}
                />
              </div>
              <span className={`shrink-0 text-sm tabular-nums ${charWarn ? 'font-bold text-amber-700' : 'text-snd-night/50'}`}>
                {charsLeft} {t('booth.charsLeft')}
              </span>
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block font-display text-lg">{t('booth.nameLabel')}</span>
            <input
              className={fieldClass}
              value={name}
              maxLength={limits.nameMax}
              autoComplete="name"
              onChange={(e) => {
                setName(e.target.value);
                clearError();
              }}
            />
          </label>

          {config?.features.departments && (
            <label className="block">
              <span className="mb-2 block font-display text-lg">{t('booth.departmentLabel')}</span>
              <select
                className={fieldClass}
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  clearError();
                }}
              >
                <option value="">—</option>
                {config.departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="font-display text-lg">{t('booth.signLabel')}</span>
              <button
                type="button"
                className="min-h-[44px] rounded-lg border border-snd-night/15 px-3 text-sm text-snd-night/70 transition hover:border-saudi hover:text-saudi"
                onClick={() => {
                  signature.current?.clear();
                  clearError();
                }}
              >
                {t('booth.clearSignature')}
              </button>
            </div>
            <SignatureField ref={signature} onStrokeEnd={clearError} />
            <p className="mt-2 text-sm text-snd-night/45">{t('booth.signHint')}</p>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-300/80 bg-red-50 px-4 py-3 text-base font-semibold text-red-900"
            >
              {error}
            </p>
          )}

          <Button
            className="min-h-[64px] w-full text-2xl shadow-[0_8px_24px_rgba(14,138,70,0.35)]"
            disabled={status === 'submitting'}
            onClick={submit}
          >
            {status === 'submitting' ? t('booth.sending') : t('booth.submit')}
          </Button>

          <footer className="mt-auto border-t border-snd-night/10 pt-6">
            <CoBrand tone="light" className="justify-center text-snd-night/70" />
          </footer>
        </div>

        <div aria-hidden className="snd-pattern-sleeping-line h-2.5 w-full" />
        <div aria-hidden className="snd-checker h-4 w-full" />
      </div>
      </SndPatternFrame>
    </main>
  );
}
