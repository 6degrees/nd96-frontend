'use client';

import { Lang, Milestone, Reign } from '@/shared/api/types';
import { useEffect, useRef } from 'react';

/**
 * The Kings & Energy journey as an actual timeline.
 *
 * Displays all reigns and their milestones on one continuous rail.
 * The timeline is RTL-aware and uses the API field names directly.
 */
export function TimelineRail({ reigns, lang, reignIndex, milestoneIndex, onSelect }: {
    reigns: Reign[];
    lang: Lang;
    reignIndex: number;
    milestoneIndex: number;
    onSelect: (reign: number, milestone: number) => void;
}) {
    /*
    |--------------------------------------------------------------------------
    | Timeline Metrics
    |--------------------------------------------------------------------------
    */

    const totalMilestones = reigns.reduce(
        (total, reign) => total + reign.milestones.length,
        0,
    );

    const gridTemplateColumns = `repeat(${totalMilestones}, minmax(0, 1fr))`;

    const reignBoundaries = reigns.reduce<number[]>(
        (boundaries, reign, index) => {
            if (index > 0) {
                const boundary = reigns
                    .slice(0, index)
                    .reduce(
                        (total, previousReign) =>
                            total + previousReign.milestones.length,
                        0,
                    );

                boundaries.push(boundary);
            }

            return boundaries;
        },
        [],
    );

    /*
    |--------------------------------------------------------------------------
    | Responsive Minimum Width
    |--------------------------------------------------------------------------
    */

    const timelineMinWidth = Math.max(
        900,
        totalMilestones * 72,
    );

    /*
    |--------------------------------------------------------------------------
    | Timeline Drag & Scroll State
    |--------------------------------------------------------------------------
    */

    const scrollRef = useRef<HTMLDivElement>(null);
    const activeNodeRef = useRef<HTMLButtonElement | null>(null);
    const pointerDown = useRef(false);
    const dragging = useRef(false);
    const suppressClick = useRef(false);
    const startX = useRef(0);
    const startScrollLeft = useRef(0);

    /*
    |--------------------------------------------------------------------------
    | Auto-Scroll Active Node into View (RTL & LTR Compatible)
    |--------------------------------------------------------------------------
    |
    | استخدام scrollIntoView يضمن تمرير الحاوية أفقياً بسلاسة
    | وإحضار النقطة النشطة إلى منتصف الشاشة بغض النظر عن اتجاه اللغة (RTL/LTR).
    |
    */

    useEffect(() => {
        if (!activeNodeRef.current) return;

        activeNodeRef.current.scrollIntoView({
            behavior: 'smooth',
            inline: 'center',
            block: 'nearest',
        });
    }, [reignIndex, milestoneIndex]);

    /*
    |--------------------------------------------------------------------------
    | Handlers
    |--------------------------------------------------------------------------
    */

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;
        const element = scrollRef.current;
        if (!element) return;

        pointerDown.current = true;
        dragging.current = false;
        suppressClick.current = false;

        startX.current = e.clientX;
        startScrollLeft.current = element.scrollLeft;
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!pointerDown.current) return;
        const element = scrollRef.current;
        if (!element) return;

        const distance = e.clientX - startX.current;

        if (!dragging.current && Math.abs(distance) > 5) {
            dragging.current = true;
            suppressClick.current = true;
            element.setPointerCapture(e.pointerId);
        }

        if (dragging.current) {
            element.scrollLeft = startScrollLeft.current - distance;
        }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        const element = scrollRef.current;
        pointerDown.current = false;

        if (element?.hasPointerCapture(e.pointerId)) {
            element.releasePointerCapture(e.pointerId);
        }
    };

    const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!suppressClick.current) return;
        e.preventDefault();
        e.stopPropagation();
        suppressClick.current = false;
    };

    return (
        <div className="w-full min-w-0 select-none">
            <div
                ref={scrollRef}
                className="timeline-scroll w-full min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain cursor-grab select-none active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                onPointerDown={(e) => {
                    e.stopPropagation();
                    handlePointerDown(e);
                }}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onClickCapture={handleClickCapture}
            >
                <div
                    className="relative w-full min-w-0 lg:min-w-0"
                    style={{
                        minWidth: `${timelineMinWidth}px`,
                    }}
                >
                    {/* Timeline Area */}
                    <div className="relative w-full">
                        {/* Boundaries */}
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-0 z-10 grid w-full min-w-0"
                            style={{ gridTemplateColumns }}
                        >
                            {reignBoundaries.map((boundary) => (
                                <div
                                    key={`boundary-${boundary}`}
                                    className="h-full border-s border-white/10"
                                    style={{ gridColumnStart: boundary + 1 }}
                                />
                            ))}
                        </div>

                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-y-0 start-0 z-10 w-px bg-white/10"
                        />

                        {/* Horizontal Line */}
                        <div
                            aria-hidden
                            className="satorp-line-gradient pointer-events-none absolute inset-x-0 top-1/2 z-20 h-[clamp(2px,min(0.25vw,0.4vh),4px)] -translate-y-1/2 rounded-full opacity-80"
                        />

                        {/* Milestones Nodes */}
                        <div
                            className="relative z-30 grid w-full min-w-0"
                            style={{ gridTemplateColumns }}
                        >
                            {reigns.map((reign, r) =>
                                reign.milestones.map((milestone: Milestone, i: number) => {
                                    const active = r === reignIndex && i === milestoneIndex;

                                    return (
                                        <button
                                            key={milestone.id}
                                            ref={active ? activeNodeRef : null}
                                            type="button"
                                            aria-current={active ? 'step' : undefined}
                                            onClick={() => onSelect(r, i)}
                                            className="group/node relative min-w-0 h-[clamp(4rem,min(7vw,9vh),6rem)] px-[clamp(0.125rem,0.25vw,0.25rem)]"
                                        >
                                            {/* Diamond Node */}
                                            <span
                                                aria-hidden
                                                className={`
                                                    absolute left-1/2 top-1/2
                                                    -translate-x-1/2 -translate-y-1/2
                                                    rotate-45 transition-all duration-200
                                                    ${
                                                    active
                                                        ? 'h-[clamp(0.7rem,min(1.8vw,2.8vh),1.35rem)] w-[clamp(0.7rem,min(1.8vw,2.8vh),1.35rem)] bg-sand shadow-[0_0_24px_rgba(242,236,221,0.55)]'
                                                        : 'h-[clamp(0.4rem,min(0.9vw,1.4vh),0.8rem)] w-[clamp(0.4rem,min(0.9vw,1.4vh),0.8rem)] bg-snd-bright/70 group-hover/node:h-[clamp(0.6rem,min(1.3vw,1.8vh),1.1rem)] group-hover/node:w-[clamp(0.6rem,min(1.3vw,1.8vh),1.1rem)] group-hover/node:bg-snd-bright'
                                                }
                                                `}
                                            />

                                            {/* Year Label */}
                                            <span
                                                className={`
                                                    absolute inset-x-0 top-0 text-center font-mono text-[clamp(0.45rem,min(0.75vw,1.5vh),0.75rem)] leading-tight transition-colors
                                                    ${active ? 'font-bold text-sand' : 'text-sand/45 group-hover/node:text-sand/75'}
                                                `}
                                            >
                                                {milestone.year}
                                            </span>
                                        </button>
                                    );
                                }),
                            )}
                        </div>
                    </div>

                    {/* Reign Information */}
                    <div
                        className="relative grid w-full min-w-0"
                        style={{ gridTemplateColumns }}
                    >
                        {reigns.map((reign, r) => {
                            const activeReign = r === reignIndex;

                            return (
                                <button
                                    key={reign.id}
                                    type="button"
                                    onClick={() => onSelect(r, 0)}
                                    style={{
                                        gridColumn: `span ${reign.milestones.length}`,
                                    }}
                                    className={`
                                        relative min-w-0 h-[clamp(3rem,min(5vw,6vh),4rem)] px-[clamp(0.2rem,0.5vw,0.6rem)] text-center transition-colors -mt-6
                                        ${activeReign ? 'text-sand' : 'text-sand/40'}
                                    `}
                                >
                                    <span className="mx-auto block max-w-full overflow-hidden font-display whitespace-nowrap rtl:text-[clamp(0.55rem,min(1.15vw,2.2vh),1.2rem)] ltr:text-[clamp(0.75rem,min(0.9vw,1.7vh),0.95rem)] font-semibold leading-[1.15] transition-colors">
                                        {lang === 'ar' ? reign.name_ar : reign.name_en}
                                    </span>

                                    <span
                                        className={`
                                            mt-[clamp(0.2rem,0.4vh,0.35rem)] block font-mono text-[clamp(0.45rem,min(0.75vw,1.5vh),0.75rem)] leading-tight
                                            ${activeReign ? 'text-snd-bright' : 'text-sand/30'}
                                        `}
                                    >
                                        {reign.start_year} – {reign.end_year ?? '…'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}