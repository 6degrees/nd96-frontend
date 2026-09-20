'use client';

import {useLayoutEffect, useRef} from 'react';
import {renderEmoji} from '@/shared/utiles';

/*
|--------------------------------------------------------------------------
| Font Size Cache
|--------------------------------------------------------------------------
*/

// Cache the calculated font size for each message + container size.
const cache = new Map<string, number>();

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

// Check whether the complete text fits inside the container.
function fits(el: HTMLElement): boolean {
    return (
        el.scrollHeight <= el.clientHeight + 1 &&
        el.scrollWidth <= el.clientWidth + 1
    );
}

/*
|--------------------------------------------------------------------------
| Font Size Calculation
|--------------------------------------------------------------------------
*/

// Find the largest font size that fits inside the current text container.
export function fitFontSize(
    cacheKey: string,
    el: HTMLElement,
    min = 28,
    max = 72,
): number {
    const cached = cache.get(cacheKey);

    if (cached !== undefined) {
        el.style.fontSize = `${cached}px`;

        if (fits(el)) {
            return cached;
        }

        cache.delete(cacheKey);
    }

    /*
    |--------------------------------------------------------------------------
    | Requested Minimum
    |--------------------------------------------------------------------------
    */

    el.style.fontSize = `${min}px`;

    if (fits(el)) {
        let lo = min;
        let hi = max;

        /*
        |--------------------------------------------------------------------------
        | Binary Search
        |--------------------------------------------------------------------------
        */

        while (lo < hi) {
            const mid = Math.ceil((lo + hi) / 2);

            el.style.fontSize = `${mid}px`;

            if (fits(el)) {
                lo = mid;
            } else {
                hi = mid - 1;
            }
        }

        el.style.fontSize = `${lo}px`;

        cache.set(cacheKey, lo);

        return lo;
    }

    /*
    |--------------------------------------------------------------------------
    | Minimum Does Not Fit
    |--------------------------------------------------------------------------
    |
    | Allow the text to shrink below the requested minimum when necessary.
    | This prevents long messages from being clipped on small screens.
    |
    */

    const safeMinimum = 8;

    let lo = safeMinimum;
    let hi = Math.max(safeMinimum, min - 1);

    while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);

        el.style.fontSize = `${mid}px`;

        if (fits(el)) {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }

    el.style.fontSize = `${lo}px`;

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

    useLayoutEffect(() => {
        const el = ref.current;

        if (!el) {
            return;
        }

        let frame = 0;

        const update = () => {
            cancelAnimationFrame(frame);

            frame = requestAnimationFrame(() => {
                const width = Math.round(el.clientWidth);
                const height = Math.round(el.clientHeight);

                /*
                |--------------------------------------------------------------------------
                | Dimension-Aware Cache
                |--------------------------------------------------------------------------
                |
                | The same message can require different font sizes on:
                |
                | desktop
                | tablet
                | mobile
                | exhibition screen
                |
                */

                const key = [
                    id,
                    text,
                    min,
                    max,
                    width,
                    height,
                ].join(':');

                fitFontSize(
                    key,
                    el,
                    min,
                    max,
                );
            });
        };

        /*
        |--------------------------------------------------------------------------
        | Initial Measurement
        |--------------------------------------------------------------------------
        */

        update();

        /*
        |--------------------------------------------------------------------------
        | Resize Observer
        |--------------------------------------------------------------------------
        |
        | Recalculate when the actual text container changes size.
        |
        */

        const observer = new ResizeObserver(() => {
            update();
        });

        observer.observe(el);

        /*
        |--------------------------------------------------------------------------
        | Window Resize
        |--------------------------------------------------------------------------
        */

        window.addEventListener('resize', update);

        /*
        |--------------------------------------------------------------------------
        | Cleanup
        |--------------------------------------------------------------------------
        */

        return () => {
            cancelAnimationFrame(frame);

            observer.disconnect();

            window.removeEventListener(
                'resize',
                update,
            );
        };
    }, [id, text, min, max]);

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <div
            ref={ref}
            dir="auto"
            className={`user-text min-w-0 max-w-full overflow-hidden ${className ?? ''}`}
            dangerouslySetInnerHTML={{
                __html: renderEmoji(text),
            }}
        />
    );
}