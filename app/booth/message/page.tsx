'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiError, api } from '@/shared/api/client';
import type { EventConfig } from '@/shared/api/types';
import { useI18n } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';
import { LangToggle } from '@/shared/ui/LangToggle';
import { SignatureField, type SignatureHandle } from '@/shared/ui/SignatureField';
import { validateBody, validateName, validateSignature } from '@/shared/validation';

type Status = 'idle' | 'submitting' | 'sent' | 'error';

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
  const signature = useRef<SignatureHandle>(null);
  // Same clientRef across retries of one submission — the backend dedupes on
  // it when the iPad drops Wi-Fi mid-submit and the user taps Submit again.
  const clientRef = useRef<string>('');

  useEffect(() => {
    api.getConfig().then(setConfig).catch(() => setError(t('booth.retry')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const limits = config?.limits ?? { nameMax: 40, bodyMax: 180, photoMaxBytes: 0 };
  const charsLeft = limits.bodyMax - body.length;

  const reset = () => {
    setName('');
    setDepartment('');
    setBody('');
    setError(null);
    setStatus('idle');
    signature.current?.clear();
    clientRef.current = '';
    setLang(config?.defaultLanguage ?? 'ar'); // language resets with the form
  };

  // Auto-reset to the invitation 6s after success — clean slate for the next person
  useEffect(() => {
    if (status !== 'sent') return;
    const id = setTimeout(reset, 6_000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const submit = async () => {
    if (status === 'submitting') return; // disabled on first tap
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
        setError(e.localized[lang]); // the word list lives in Laravel; we only render
        clientRef.current = ''; // rejected content edited → a new submission
      } else if (e instanceof ApiError && e.errors) {
        setError(Object.values(e.errors).flat()[0] ?? t('booth.retry'));
        clientRef.current = '';
      } else {
        setError(t('booth.retry')); // timeout / network: keep clientRef, retry dedupes
      }
    }
  };

  if (status === 'sent') {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-saudi p-8 text-center">
        <h1 className="text-4xl font-bold text-white">{t('booth.sent')}</h1>
      </main>
    );
  }

  // 100dvh, never 100vh — iOS toolbars break it. Safe-area padding for iPads.
  return (
    <main
      className="mx-auto flex min-h-[100dvh] max-w-xl flex-col gap-5 bg-sand p-6 text-night"
      style={{
        paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
      }}
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('booth.title')}</h1>
          <p className="opacity-70">{t('booth.subtitle')}</p>
        </div>
        <LangToggle className="min-h-[64px] text-night" />
      </header>

      <label className="block">
        <span className="mb-1 block font-semibold">{t('booth.messageLabel')}</span>
        <textarea
          className="user-text h-36 w-full rounded-xl border border-night/20 bg-white p-4 text-xl"
          value={body}
          maxLength={limits.bodyMax} /* hard stop, never silent truncation */
          placeholder={t('booth.messagePlaceholder')}
          onChange={(e) => setBody(e.target.value)}
        />
        <span className={`text-sm ${charsLeft <= 20 ? 'font-bold text-amber-600' : 'opacity-60'}`}>
          {charsLeft} {t('booth.charsLeft')}
        </span>
      </label>

      <label className="block">
        <span className="mb-1 block font-semibold">{t('booth.nameLabel')}</span>
        <input
          className="user-text w-full rounded-xl border border-night/20 bg-white p-4 text-xl"
          value={name}
          maxLength={limits.nameMax}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      {config?.features.departments && (
        <label className="block">
          <span className="mb-1 block font-semibold">{t('booth.departmentLabel')}</span>
          <select
            className="w-full rounded-xl border border-night/20 bg-white p-4 text-xl"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
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
        <div className="mb-1 flex items-center justify-between">
          <span className="font-semibold">{t('booth.signLabel')}</span>
          <button type="button" className="min-h-[44px] text-sm underline" onClick={() => signature.current?.clear()}>
            {t('booth.clearSignature')}
          </button>
        </div>
        <SignatureField ref={signature} />
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-100 p-3 font-semibold text-red-800">
          {error}
        </p>
      )}

      <Button className="min-h-[64px] text-2xl" disabled={status === 'submitting'} onClick={submit}>
        {status === 'submitting' ? t('booth.sending') : t('booth.submit')}
      </Button>
    </main>
  );
}
