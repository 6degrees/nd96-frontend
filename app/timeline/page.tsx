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

/* ADDED */
import { createTransport } from '@/shared/transport';

/*
|--------------------------------------------------------------------------
| Timeline Configuration
|--------------------------------------------------------------------------
*/

const CACHE_KEY = 'nd96.timeline';
const IDLE_MS = 90_000;

/*
|--------------------------------------------------------------------------
| Timeline Navigation State
|--------------------------------------------------------------------------
|
| Stores the currently selected reign and milestone.
| The attract state is used to show the idle landing screen.
|
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
|
| Reads the cached timeline from localStorage and validates
| the stored data before returning it.
|
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
|
| Loads all milestone images in advance so navigation
| between milestones feels instant.
|
*/

function preload(doc: TimelineDoc): Promise<void> {
    const urls = doc.data.flatMap((reign) =>
        reign.milestones
            .map((milestone) => milestone.image)
            .filter(Boolean)
    );

    return Promise.all(
        urls.map(
            (src) =>
                new Promise<void>((resolve) => {
                    const img = new Image();
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                    img.src = src ?? '';
                })
        )
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
    |
    | Loads the latest data from the API and saves it locally.
    | Falls back to the cached version when the API is unavailable.
    |
    */

    const loadTimeline = useCallback(async (): Promise<void> => {
        let loaded: TimelineDoc | null = null;

        try {
            loaded = await api.getTimeline();

            localStorage.setItem(
                CACHE_KEY,
                JSON.stringify(loaded)
            );
        } catch {
            loaded = loadCache();
        }

        if (!loaded) return;

        await preload(loaded);
        setDoc(loaded);
    }, []);

    useEffect(() => {
        void loadTimeline();
    }, [loadTimeline]);

    /*
    |--------------------------------------------------------------------------
    | Screen Commands
    |--------------------------------------------------------------------------
    */

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

                screenUnsubscribe = transport.subscribe('screen.kings_energy_journey', {
                    'screen.command': ({command}) => {
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
                });
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
    |
    | Leaves the attract screen as soon as the user interacts
    | with the timeline.
    |
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
    |
    | Returns the timeline to the attract screen after
    | 90 seconds without user interaction.
    |
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
            IDLE_MS
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
                IDLE_MS
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
    |
    | Gets the currently selected reign and milestone
    | based on the navigation indexes.
    |
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
    |
    | Forces the media and story sections to re-render when
    | the selected milestone changes.
    |
    */

    const contentKey = `${reign.id}-${milestone.id}`;

    /*
    |--------------------------------------------------------------------------
    | Attract Screen
    |--------------------------------------------------------------------------
    |
    | Displays the idle landing screen before user interaction.
    |
    */

    if (holding) {
        return (
            <Stage>
                <div className="snd-grid relative h-full w-full bg-night">
                    <SndPatternFrame
                        className="flex h-full w-full flex-col items-center justify-center gap-8 px-24"
                        side={false}
                        bottom={false}
                    >
                        <WaveOverlay className="opacity-40" />
                        <MessageTitleRail
                            title="اليوم الوطني السعودي ٩٦"
                            className="relative z-10"
                        />
                        <p className="relative z-10 text-3xl text-sand/55">
                            SATORP · Saudi National Day 96
                        </p>
                        <MotifTriple className="relative z-10" tone="cyan" />
                        <CoBrand
                            tone="dark"
                            divider={false}
                            logoHeight={56}
                            className="relative z-10 mt-4"
                        />
                    </SndPatternFrame>
                </div>
            </Stage>
        );
    }

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

                            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-24 py-16 text-center">
                                <CoBrand
                                    tone="dark"
                                    divider={false}
                                    logoHeight={80}
                                    className="mb-10 gap-8 sm:gap-12"
                                />

                                <SaduSleepingLine className="mb-10 w-full max-w-2xl" />

                                <h1 className="font-display max-w-3xl text-8xl leading-tight text-sand">
                                    {t('timeline.title')}
                                </h1>

                                <SaduSleepingLine className="mt-10 w-full max-w-2xl" />

                                <p className="mt-10 max-w-2xl animate-pulse text-4xl text-sand/60">
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
    |
    | Displays the selected milestone with its image, story,
    | branding and navigation rail.
    |
    */

    return (
        <Stage>
            <div
                className="relative flex h-full w-full bg-night"
                onPointerDown={touch}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
            >
                {/* first half: the image, full stage height, edge to edge */}
                <div
                    key={`media-${contentKey}`}
                    className="milestone-enter relative h-full min-w-0 flex-1 basis-0"
                >
                    <TimelineMedia
                        src={milestone.image ?? ''}
                        title={milestoneTitle}
                        placeholder={t('timeline.photoPlaceholder')}
                        fill
                    />

                    {/* SATORP mark over the image — scrim keeps it legible on any photo */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-night/70 to-transparent"
                    />

                    <div className="absolute start-10 top-8 z-10 drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
                        <SatorpLogo tone="dark" height={52} />
                    </div>
                </div>

                {/* second half: header + the story */}
                <div className="snd-grid relative flex h-full min-w-0 flex-1 basis-0 flex-col p-10 pb-56">
                    <WaveOverlay className="pointer-events-none opacity-50" />

                    <PageHeader
                        title={t('timeline.title')}
                        subtitle={t('timeline.subtitle')}
                    />

                    <article
                        key={contentKey}
                        className="milestone-enter relative z-10 flex min-h-0 flex-1 flex-col justify-center"
                    >
                        <p className="mb-3 font-display text-4xl text-snd-terracotta">
                            {milestone.year} هـ
                        </p>

                        <h2 className="mb-6 font-display text-6xl leading-tight text-sand">
                            {milestoneTitle}
                        </h2>

                        <p className="max-w-3xl text-3xl leading-relaxed text-sand/85">
                            {milestoneBody}
                        </p>
                    </article>
                </div>

                {/* the journey: one spine, full width over both halves */}
                <nav
                    aria-label={t('timeline.title')}
                    className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-night via-night/85 to-transparent px-10 pb-4 pt-14"
                >
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
                </nav>
            </div>
        </Stage>
    );
}
