'use client';

import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

const styles: Record<Variant, string> = {
  primary: 'bg-saudi text-white active:opacity-80',
  secondary: 'bg-white/10 text-current active:bg-white/20',
  danger: 'bg-red-700 text-white active:opacity-80',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

// min-h 44px everywhere, 64px for anything a nervous first-time user hits.
export function Button({ variant = 'primary', className, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={`min-h-[44px] rounded-xl px-6 text-lg font-semibold transition-opacity disabled:opacity-40 ${styles[variant]} ${className ?? ''}`}
      {...rest}
    />
  );
}
