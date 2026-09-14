'use client';

import {useLayoutEffect, useRef} from 'react';
import {renderEmoji} from "@/shared/utiles";

/*
|--------------------------------------------------------------------------
| Font Size Cache
|--------------------------------------------------------------------------
*/

// Cache the calculated font size for each message.
const cache = new Map<string, number>();

/*
|--------------------------------------------------------------------------
| Font Size Calculation
|--------------------------------------------------------------------------
*/

// Find the largest font size that fits inside the text container.
export function fitFontSize(
    cacheKey: string,
    el: HTMLElement,
    min = 28,
    max = 72,
): number {
    const cached = cache.get(cacheKey);

    // Use the cached size when the message was already measured.
    if (cached !== undefined) {
        el.style.fontSize = `${cached}px`;
        return cached;
    }

    let lo = min;
    let hi = max;

    // Use binary search to find the best fitting font size.
    while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);

        el.style.fontSize = `${mid}px`;

        if (el.scrollHeight <= el.clientHeight) {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }

    // Cache the result to avoid recalculating the same message.
    cache.set(cacheKey, lo);

    return lo;
}

/*
|--------------------------------------------------------------------------
| Props
|--------------------------------------------------------------------------
*/

interface FitTextProps {
    id: string;
    text: string;
    min?: number;
    max?: number;
    className?: string;
}

/*
|--------------------------------------------------------------------------
| Fit Text
|--------------------------------------------------------------------------
*/

export function FitText({
                            id,
                            text,
                            min = 28,
                            max = 72,
                            className,
                        }: FitTextProps) {
    const ref = useRef<HTMLDivElement>(null);

    /*
    |--------------------------------------------------------------------------
    | Font Size
    |--------------------------------------------------------------------------
    */

    // Recalculate the font size whenever the message or limits change.
    useLayoutEffect(() => {
        const el = ref.current;

        if (!el) return;

        // Include min/max so different layouts keep separate cached sizes.
        const key = `${id}:${min}:${max}`;

        el.style.fontSize = `${fitFontSize(key, el, min, max)}px`;
    }, [id, text, min, max]);

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    // Render the message text with automatic font sizing.
    return (
        <div
            ref={ref}
            dir="auto"
            className={`user-text overflow-hidden ${className ?? ''}`}
            dangerouslySetInnerHTML={{
                __html: renderEmoji(text),
            }}
        />
    );
}

