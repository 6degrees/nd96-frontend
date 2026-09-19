'use client';

import type { ReactNode } from 'react';

export function Stage({ children }: { children: ReactNode }) {
    return (
        <div className="fixed inset-0 h-[100dvh] w-[100vw] overflow-hidden bg-night">
            <div className="relative h-full w-full min-h-0 min-w-0">
                {children}
            </div>
        </div>
    );
}