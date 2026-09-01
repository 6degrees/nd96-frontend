'use client';

import type { ReactNode } from 'react';
import { Button } from './Button';

// In-page dialog. Never window.confirm — a native modal blocks the render
// loop and, on the wall player, freezes the screen (spec §6).
interface DialogProps {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function Dialog({ open, title, children, confirmLabel, cancelLabel, onConfirm, onCancel }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-night shadow-2xl">
        <h2 className="mb-2 text-xl font-bold">{title}</h2>
        {children}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" className="text-night" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
