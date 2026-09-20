'use client';

import { Lang, Milestone, Reign } from '@/shared/api/types';
import {useRef} from "react";

/**
 * The Kings & Energy journey as an actual timeline.
 *
 * Displays all reigns and their milestones on one continuous rail.
 * The timeline is RTL-aware and uses the API field names directly.
 */
export function TimelineRail({reigns, lang, reignIndex, milestoneIndex, onSelect,}: {
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

    /*
    |--------------------------------------------------------------------------
    | Grid Columns
    |--------------------------------------------------------------------------
    |
    | Every milestone gets exactly one column.
    |
    */

    const gridTemplateColumns = `repeat(${totalMilestones}, minmax(0, 1fr))`;

    /*
    |--------------------------------------------------------------------------
    | Reign Boundaries
    |--------------------------------------------------------------------------
    |
    | A boundary is placed at the beginning of every reign except
    | the first one.
    |
    | Example:
    |
    | Reign 1: 0 ───────── 5
    | Reign 2:             5 ───────── 9
    | Reign 3:                         9 ───────── 12
    |
    | Therefore the same vertical line represents:
    |
    | - End of the previous reign
    | - Start of the next reign
    |
    | There is intentionally NO boundary after the final reign.
    |
    */

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
    |
    | Small screens get horizontal scrolling.
    | The minimum width grows with the number of milestones so
    | milestones do not become too compressed.
    |
    */
    const timelineMinWidth = Math.max(900, totalMilestones * 72);

    /*
    |--------------------------------------------------------------------------
    | Timeline Drag State
    |--------------------------------------------------------------------------
    |
    | Tracks pointer movement to support horizontal dragging while
    | preserving normal click behavior on timeline milestones.
    |
    */

    const scrollRef = useRef<HTMLDivElement>(null);
    const pointerDown = useRef(false);
    const dragging = useRef(false);
    const suppressClick = useRef(false);
    const startX = useRef(0);
    const startScrollLeft = useRef(0);

    /*
    |--------------------------------------------------------------------------
    | Pointer Down
    |--------------------------------------------------------------------------
    |
    | Starts tracking the pointer position without immediately
    | activating pointer capture, allowing normal clicks to work.
    |
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

    /*
    |--------------------------------------------------------------------------
    | Pointer Move
    |--------------------------------------------------------------------------
    |
    | Activates dragging only after the pointer moves beyond the
    | threshold to distinguish dragging from a normal click.
    |
    */

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

    /*
    |--------------------------------------------------------------------------
    | Pointer Up
    |--------------------------------------------------------------------------
    |
    | Stops pointer tracking and releases pointer capture after
    | the drag operation is completed.
    |
    */

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        const element = scrollRef.current;

        pointerDown.current = false;

        if (element?.hasPointerCapture(e.pointerId)) {
            element.releasePointerCapture(e.pointerId);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Click Capture
    |--------------------------------------------------------------------------
    |
    | Prevents a click from being triggered after an actual drag,
    | while keeping normal timeline clicks working.
    |
    */

    const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!suppressClick.current) return;

        e.preventDefault();
        e.stopPropagation();

        suppressClick.current = false;
    };

    return (
        <div className="w-full min-w-0 select-none">
            {/*
            |--------------------------------------------------------------------------
            | Horizontal Scroll Container
            |--------------------------------------------------------------------------
            |
            | Small screens:
            |   Scroll horizontally.
            |
            | Large screens:
            |   Use the complete available width.
            |
            */}
            <div
                ref={scrollRef}
                className="timeline-scroll w-full min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain cursor-grab select-none active:cursor-grabbing"
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
                    {/*
                    |--------------------------------------------------------------------------
                    | Timeline Area
                    |--------------------------------------------------------------------------
                    */}
                    <div className="relative w-full">
                        {/*
                        |--------------------------------------------------------------------------
                        | Reign Boundary Lines
                        |--------------------------------------------------------------------------
                        |
                        | Only internal reign boundaries are rendered.
                        | The final reign intentionally has no ending line.
                        |
                        */}
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-0 z-10 grid w-full min-w-0"
                            style={{
                                gridTemplateColumns,
                            }}
                        >
                            {reignBoundaries.map((boundary) => (
                                <div
                                    key={`boundary-${boundary}`}
                                    className="h-full border-s border-white/10"
                                    style={{
                                        gridColumnStart: boundary + 1,
                                    }}
                                />
                            ))}
                        </div>

                        {/*
                        |--------------------------------------------------------------------------
                        | Left Boundary
                        |--------------------------------------------------------------------------
                        |
                        | Marks the beginning of the complete timeline.
                        |
                        */}
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-y-0 start-0 z-10 w-px bg-white/10"
                        />

                        {/*
                        |--------------------------------------------------------------------------
                        | Horizontal Timeline
                        |--------------------------------------------------------------------------
                        */}
                        <div
                            aria-hidden
                            className="satorp-line-gradient pointer-events-none absolute inset-x-0 top-1/2 z-20 h-[clamp(2px,min(0.25vw,0.4vh),4px)] -translate-y-1/2 rounded-full opacity-80"
                        />

                        {/*
                        |--------------------------------------------------------------------------
                        | Milestones
                        |--------------------------------------------------------------------------
                        */}
                        <div
                            className="relative z-30 grid w-full min-w-0"
                            style={{
                                gridTemplateColumns,
                            }}
                        >
                            {reigns.map((reign, r) =>
                                reign.milestones.map(
                                    (
                                        milestone: Milestone,
                                        i: number,
                                    ) => {
                                        const active =
                                            r === reignIndex &&
                                            i === milestoneIndex;

                                        return (
                                            <button
                                                key={milestone.id}
                                                type="button"
                                                aria-current={
                                                    active
                                                        ? 'step'
                                                        : undefined
                                                }
                                                onClick={() =>
                                                    onSelect(r, i)
                                                }
                                                className="group/node relative min-w-0 h-[clamp(4rem,min(8vw,10vh),7rem)] px-[clamp(0.125rem,0.25vw,0.25rem)]"
                                            >
                                                {/* Year */}
                                                <span
                                                    className={`
                                                        absolute inset-x-0 top-0 text-center font-mono
                                                        text-[clamp(0.5rem,min(1vw,2vh),0.875rem)]
                                                        leading-tight transition-colors
                                                        ${
                                                        active
                                                            ? 'font-bold text-sand'
                                                            : 'text-sand/45 group-hover/node:text-sand/75'
                                                    }
                                                    `}
                                                >
                                                    {milestone.year}
                                                </span>

                                                {/* Node */}
                                                <span
                                                    aria-hidden
                                                    className={`
                                                        absolute left-1/2 top-1/2 -translate-x-1/2
                                                        -translate-y-1/2 rotate-45 transition-all duration-200
                                                        ${
                                                        active
                                                            ? `
                                                                    h-[clamp(0.75rem,min(2vw,3vh),1.5rem)]
                                                                    w-[clamp(0.75rem,min(2vw,3vh),1.5rem)]
                                                                    bg-sand
                                                                    shadow-[0_0_24px_rgba(242,236,221,0.55)]
                                                                `
                                                            : `
                                                                    h-[clamp(0.45rem,min(1vw,1.5vh),0.875rem)]
                                                                    w-[clamp(0.45rem,min(1vw,1.5vh),0.875rem)]
                                                                    bg-snd-bright/70
                                                                    group-hover/node:h-[clamp(0.65rem,min(1.5vw,2vh),1.25rem)]
                                                                    group-hover/node:w-[clamp(0.65rem,min(1.5vw,2vh),1.25rem)]
                                                                    group-hover/node:bg-snd-bright
                                                                `
                                                    }
                                                    `}
                                                />
                                            </button>
                                        );
                                    },
                                ),
                            )}
                        </div>
                    </div>

                    {/*
                    |--------------------------------------------------------------------------
                    | Reign Information
                    |--------------------------------------------------------------------------
                    |
                    | Each reign occupies exactly the same number of
                    | columns as its milestones.
                    |
                    */}
                    <div
                        className="relative mt-[clamp(0.25rem,1vh,0.75rem)] grid w-full min-w-0"
                        style={{
                            gridTemplateColumns,
                        }}
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
                                        relative min-w-0 min-h-[clamp(3rem,min(7vw,8vh),5.5rem)]
                                        px-[clamp(0.25rem,0.75vw,0.75rem)]
                                        text-center transition-colors
                                        ${
                                        activeReign
                                            ? 'text-sand'
                                            : 'text-sand/40'
                                    }
                                    `}
                                >
                                    {/* Reign name */}
                                    <span className="block font-display text-[clamp(0.7rem,min(1.5vw,3vh),1.5rem)] leading-tight transition-colors">
                                        {lang === 'ar' ? reign.name_ar : reign.name_en}
                                    </span>

                                    {/* Reign years */}
                                    <span
                                        className={`
                                            mt-[clamp(0.125rem,0.5vh,0.25rem)] block font-mono
                                            text-[clamp(0.5rem,min(0.9vw,1.8vh),0.875rem)] leading-tight
                                            ${
                                            activeReign
                                                ? 'text-snd-bright'
                                                : 'text-sand/30'
                                        }
                                        `}
                                    >
                                        {reign.start_year} –{' '}
                                        {reign.end_year ?? '…'}
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