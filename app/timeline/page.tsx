'use client';

import { useCallback, useEffect, useState } from 'react';
import { create } from 'zustand';

import { api } from '@/shared/api/client';
import { TimelineSchema, type TimelineDoc } from '@/shared/api/types';
import { useI18n } from '@/shared/i18n';
import { Stage } from '@/shared/stage/Stage';
import { CoBrand, SatorpLogo } from '@/shared/ui/Brand';
import { LangToggle } from '@/shared/ui/LangToggle';
import {
    MessageTitleRail,
    MotifTriple,
    SaduSleepingLine,
    SndPatternFrame,
    TimelineMedia,
    WaveOverlay,
} from '@/shared/ui/snd/Decor';
import { PageHeader } from '@/shared/ui/snd/PageHeader';
import { TimelineRail } from '@/shared/ui/snd/TimelineRail';
import { createTransport } from '@/shared/transport';

/*
|--------------------------------------------------------------------------
| Timeline Configuration
|--------------------------------------------------------------------------
*/

const CACHE_KEY = 'nd96.timeline';
const IDLE_MS = 1_200_000;

/*
|--------------------------------------------------------------------------
| Timeline Navigation State
|--------------------------------------------------------------------------
*/

interface TimelineNav {
    reignIndex: number;
    milestoneIndex: number;
    attract: boolean;
    set: (patch: Partial<Omit<TimelineNav, 'set'>>) => void;
}

/*
|--------------------------------------------------------------------------
| Timeline Navigation Store
|--------------------------------------------------------------------------
*/

const useTimelineNav = create<TimelineNav>((set) => ({
    reignIndex: 0,
    milestoneIndex: 0,
    attract: true,
    set: (patch) => set(patch),
}));

/*
|--------------------------------------------------------------------------
| Load Timeline Cache
|--------------------------------------------------------------------------
*/

function loadCache(): TimelineDoc | null {
    try {
        const raw = localStorage.getItem(CACHE_KEY);

        return raw
            ? TimelineSchema.parse(JSON.parse(raw))
            : null;
    } catch {
        return null;
    }
}

/*
|--------------------------------------------------------------------------
| Preload Timeline Images
|--------------------------------------------------------------------------
*/

function preload(doc: TimelineDoc): Promise<void> {
    const urls = doc.data.flatMap((reign) =>
        reign.milestones
            .map((milestone) => milestone.image)
            .filter(Boolean),
    );

    return Promise.all(
        urls.map(
            (src) =>
                new Promise<void>((resolve) => {
                    const img = new Image();

                    img.onload = () => resolve();
                    img.onerror = () => resolve();

                    img.src = src ?? '';
                }),
        ),
    ).then(() => undefined);
}

/*
|--------------------------------------------------------------------------
| Timeline Page
|--------------------------------------------------------------------------
*/

export default function TimelinePage() {
    const { t, lang } = useI18n();

    const [doc, setDoc] = useState<TimelineDoc | null>(null);
    const [holding, setHolding] = useState(false);

    const {
        reignIndex,
        milestoneIndex,
        attract,
        set,
    } = useTimelineNav();

    /*
    |--------------------------------------------------------------------------
    | Load Timeline Data
    |--------------------------------------------------------------------------
    */

    const loadTimeline = useCallback(async (): Promise<void> => {
        let loaded: TimelineDoc | null = null;

        try {
            loaded = await api.getTimeline();

            localStorage.setItem(
                CACHE_KEY,
                JSON.stringify(loaded),
            );
        } catch {
            loaded = loadCache();
        }

        if (!loaded) return;

        setDoc(loaded);
        void preload(loaded);
    }, []);

    useEffect(() => {
        void loadTimeline();
    }, [loadTimeline]);

    /*
    |--------------------------------------------------------------------------
    | Screen Commands
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        let screenUnsubscribe: (() => void) | undefined;
        let cancelled = false;

        const boot = async (): Promise<void> => {
            try {
                const transport = await createTransport();

                if (cancelled) return;

                screenUnsubscribe = transport.subscribe(
                    'screen.kings_energy_journey',
                    {
                        'screen.command': ({ command }) => {
                            switch (command) {
                                case 'holding':
                                    setHolding(true);
                                    break;

                                case 'resume':
                                    setHolding(false);
                                    break;

                                case 'clear':
                                case 'resetEvent':
                                    setHolding(false);

                                    set({
                                        attract: true,
                                        reignIndex: 0,
                                        milestoneIndex: 0,
                                    });

                                    void loadTimeline();
                                    break;
                            }
                        },
                    },
                );
            } catch {
                // Ignore realtime connection errors.
            }
        };

        void boot();

        return () => {
            cancelled = true;
            screenUnsubscribe?.();
        };
    }, [set, loadTimeline]);

    /*
    |--------------------------------------------------------------------------
    | Handle User Interaction
    |--------------------------------------------------------------------------
    */

    const touch = useCallback(() => {
        if (holding) return;

        if (useTimelineNav.getState().attract) {
            set({ attract: false });
        }
    }, [set, holding]);

    /*
    |--------------------------------------------------------------------------
    | Idle Timer
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (holding) return;

        let timer = setTimeout(
            () =>
                set({
                    attract: true,
                    reignIndex: 0,
                    milestoneIndex: 0,
                }),
            IDLE_MS,
        );

        const bump = () => {
            clearTimeout(timer);

            timer = setTimeout(
                () =>
                    set({
                        attract: true,
                        reignIndex: 0,
                        milestoneIndex: 0,
                    }),
                IDLE_MS,
            );
        };

        window.addEventListener('pointerdown', bump);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('pointerdown', bump);
        };
    }, [set, holding]);

    /*
    |--------------------------------------------------------------------------
    | Loading State
    |--------------------------------------------------------------------------
    */

    if (!doc) {
        return (
            <Stage>
                <SndPatternFrame
                    className="snd-grid flex h-full w-full items-center justify-center bg-night text-5xl"
                    side={false}
                    bottom={false}
                >
                    {t('common.loading')}
                </SndPatternFrame>
            </Stage>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Current Timeline Item
    |--------------------------------------------------------------------------
    */

    const reign = doc.data[reignIndex];
    const milestone = reign?.milestones[milestoneIndex];

    /*
    |--------------------------------------------------------------------------
    | Guard Against Invalid Index
    |--------------------------------------------------------------------------
    */

    if (!reign || !milestone) {
        return null;
    }

    const milestoneTitle =
        lang === 'ar'
            ? milestone.title_ar
            : milestone.title_en;

    const milestoneBody =
        lang === 'ar'
            ? milestone.description_ar
            : milestone.description_en;

    /*
    |--------------------------------------------------------------------------
    | Content Key
    |--------------------------------------------------------------------------
    */

    const contentKey = `${reign.id}-${milestone.id}`;

    /*
    |--------------------------------------------------------------------------
    | Holding Screen
    |--------------------------------------------------------------------------
    */

    if (holding) {
        return (
            <Stage>
                <div className="snd-grid relative h-full w-full bg-night">
                    <SndPatternFrame
                        className="
                flex h-full w-full flex-col items-center justify-center
                gap-[clamp(1rem,min(3vh,2vw),2rem)]
                px-[clamp(1rem,4vw,6rem)]
                py-[clamp(1.5rem,5vh,4rem)]
            "
                        side={false}
                        bottom={false}
                    >
                        <WaveOverlay className="opacity-40" />

                        <MessageTitleRail
                            title="اليوم الوطني السعودي ٩٦"
                            className="relative z-10"
                        />

                        <p className="relative z-10 text-[clamp(0.9rem,min(2vw,3.5vh),1.875rem)] leading-tight text-center text-sand/55">
                            SATORP · Saudi National Day 96
                        </p>

                        <MotifTriple
                            className="relative z-10"
                            tone="cyan"
                        />

                        <CoBrand
                            tone="dark"
                            divider={false}
                            logoHeight={56}
                            className="relative z-10 mt-[clamp(0.25rem,min(1vh,1vw),1rem)]"
                        />
                    </SndPatternFrame>
                </div>
            </Stage>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Attract Screen
    |--------------------------------------------------------------------------
    */

    if (attract) {
        return (
            <Stage>
                <div className="relative h-full w-full">
                    <LangToggle
                        variant="segmented"
                        placement="stage"
                        tone="dark"
                    />

                    <button
                        type="button"
                        className="snd-grid relative flex h-full w-full flex-col overflow-hidden bg-night"
                        onClick={touch}
                    >
                        <SndPatternFrame
                            className="flex h-full w-full flex-col"
                            side={false}
                            bottom={false}
                        >
                            <WaveOverlay />

                            <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-[clamp(1rem,4vw,6rem)] py-[clamp(2rem,6vh,5rem)] text-center">
                                <CoBrand
                                    tone="dark"
                                    divider={false}
                                    logoHeight={80}
                                    className="mb-[clamp(1.5rem,min(4vh,3vw),3rem)] gap-[clamp(1rem,min(3vw,5vh),3rem)]"
                                />

                                <SaduSleepingLine className="mb-[clamp(1.5rem,min(4vh,3vw),3rem)] w-full max-w-[min(80vw,50rem)]" />

                                <h1 className="max-w-[min(90vw,70rem)] font-display text-[clamp(2rem,min(7vw,12vh),8rem)] leading-[1.1] text-sand">
                                    {t('timeline.title')}
                                </h1>

                                <SaduSleepingLine className="mt-[clamp(1.5rem,min(4vh,3vw),3rem)] w-full max-w-[min(80vw,50rem)]" />

                                <p className="mt-[clamp(1.5rem,min(4vh,3vw),3rem)] max-w-[min(85vw,50rem)] animate-pulse text-[clamp(0.9rem,min(2.5vw,4vh),2.5rem)] leading-tight text-sand/60">
                                    {t('timeline.attract')}
                                </p>
                            </div>
                        </SndPatternFrame>
                    </button>
                </div>
            </Stage>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Timeline Content
    |--------------------------------------------------------------------------
    */

    return (
        <Stage>
            <div
                className="
                    relative flex h-full w-full min-h-0 min-w-0 flex-col
                    overflow-hidden bg-night
                    lg:flex-row
                    [@media(min-aspect-ratio:2/1)]:flex-row
                "
                onPointerDown={touch}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
            >
                {/* Media */}
                <div
                    key={`media-${contentKey}`}
                    className="
                        milestone-enter relative min-h-0 min-w-0 shrink-0
                        h-[42%] w-full overflow-visible
                        md:h-[48%]
                        lg:h-full lg:w-1/2
                        [@media(min-aspect-ratio:2/1)]:h-full
                        [@media(min-aspect-ratio:2/1)]:w-1/2
                    "
                >
                    <TimelineMedia
                        src={milestone.image ?? ''}
                        title={milestoneTitle}
                        placeholder={t('timeline.photoPlaceholder')}
                        fill
                    />

                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[clamp(8rem,20vh,18rem)] bg-gradient-to-b from-night/80 via-night/35 to-transparent"
                    />

                    <div className="absolute start-[clamp(0.75rem,2vw,2.5rem)] top-[clamp(0.75rem,2vh,2rem)] z-20 drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
                        <SatorpLogo tone="dark" height={52} />
                    </div>
                </div>

                {/* Story */}
                <div
                    className="
                        snd-grid relative flex min-h-0 min-w-0 flex-1 flex-col
                        pb-[clamp(5rem,12vh,10rem)]
                    "
                >
                    <WaveOverlay className="pointer-events-none opacity-50" />

                    {/* Header */}
                    <div className="relative z-10 px-[clamp(1rem,3vw,3rem)] pt-[clamp(1rem,3vh,3rem)]">
                        <PageHeader
                            title={t('timeline.title')}
                            subtitle={t('timeline.subtitle')}
                        />
                    </div>

                    {/* Story Content */}
                    <article
                        key={contentKey}
                        className="
                            milestone-enter relative z-10 flex min-h-0 flex-1
                            flex-col justify-start
                            px-[clamp(1rem,3vw,3rem)]
                            py-[clamp(1rem,3vh,3rem)]
                            lg:justify-center
                        "
                    >
                        <p className="mb-[clamp(0.25rem,1vh,1rem)] font-display text-[clamp(1.1rem,min(2.5vw,4.5vh),2.25rem)] text-snd-terracotta">
                            {milestone.year} هـ
                        </p>

                        <h2 className="mb-[clamp(0.75rem,min(2vh,2vw),1.5rem)] max-w-[95%] font-display text-[clamp(1.5rem,min(4vw,7vh),3.75rem)] leading-[1.1] text-sand">
                            {milestoneTitle}
                        </h2>

                        <p className="max-w-[95%] text-[clamp(0.95rem,min(2vw,3.5vh),1.875rem)] leading-[1.6] text-sand/85">
                            {milestoneBody}
                        </p>
                    </article>
                </div>

                {/* Timeline */}
                <nav
                    aria-label={t('timeline.title')}
                    className="
                        absolute inset-x-0 bottom-0 z-20
                        bg-gradient-to-t from-night via-night/85 to-transparent
                        px-[clamp(0.5rem,2vw,2.5rem)]
                        pb-[clamp(0.5rem,1vh,1rem)]
                        pt-[clamp(2rem,6vh,5rem)]
                    "
                >
                    <div className="w-full min-w-0 overflow-x-auto overflow-y-hidden">
                        <TimelineRail
                            reigns={doc.data}
                            lang={lang}
                            reignIndex={reignIndex}
                            milestoneIndex={milestoneIndex}
                            onSelect={(r, m) =>
                                set({
                                    reignIndex: r,
                                    milestoneIndex: m,
                                })
                            }
                        />
                    </div>
                </nav>
            </div>
        </Stage>
    );
}