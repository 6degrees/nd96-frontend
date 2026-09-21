'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { create } from 'zustand';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperClass } from 'swiper';
import 'swiper/css';

import { api } from '@/shared/api/client';
import { TimelineSchema, type TimelineDoc, type Reign, type Milestone } from '@/shared/api/types';
import { useI18n } from '@/shared/i18n';
import { Stage } from '@/shared/stage/Stage';
import { CoBrand } from '@/shared/ui/Brand';
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

const useTimelineNav = create<TimelineNav>((set) => ({
    reignIndex: 0,
    milestoneIndex: 0,
    attract: true,
    set: (patch) => set(patch),
}));

/*
|--------------------------------------------------------------------------
| Load & Preload Utilities
|--------------------------------------------------------------------------
*/

function loadCache(): TimelineDoc | null {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        return raw ? TimelineSchema.parse(JSON.parse(raw)) : null;
    } catch {
        return null;
    }
}

function preload(doc: TimelineDoc): Promise<void> {
    const urls = doc.data.flatMap((reign) =>
        reign.milestones.map((m) => m.image).filter(Boolean),
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

interface FlatSlide {
    reignIndex: number;
    milestoneIndex: number;
    reign: Reign;
    milestone: Milestone;
}

/*
|--------------------------------------------------------------------------
| Single Slide Item View
|--------------------------------------------------------------------------
*/

function SlideView({
                       slide,
                       isRtl,
                       t,
                   }: {
    slide: FlatSlide;
    isRtl: boolean;
    t: (key: string) => string;
}) {
    const title = isRtl ? slide.milestone.title_ar : slide.milestone.title_en;
    const body = isRtl ? slide.milestone.description_ar : slide.milestone.description_en;

    return (
        <div className="flex h-full w-full min-h-0 min-w-0 flex-col lg:flex-row select-none">
            {/* Media Section */}
            <div className="relative min-h-0 min-w-0 shrink-0 h-[50vh] lg:h-full w-full lg:w-1/2 overflow-hidden pointer-events-none">
                <TimelineMedia
                    src={slide.milestone.image ?? ''}
                    title={title ?? ''}
                    placeholder={t('timeline.photoPlaceholder')}
                    fill
                />
                <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[clamp(8rem,20vh,18rem)] bg-gradient-to-b from-night/80 via-night/35 to-transparent" />
            </div>

            {/* Content Section */}
            <div className="snd-grid relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto [scrollbar-width:none] lg:h-full [&::-webkit-scrollbar]:hidden bg-night">
                <WaveOverlay className="pointer-events-none opacity-50" />

                <article className="relative z-10 flex min-h-0 flex-1 flex-col justify-start lg:justify-center px-[clamp(1rem,3vw,3rem)] pt-[clamp(1rem,2vh,2rem)]">
                    <div className="relative z-10 mb-[clamp(2rem,4vh,5rem)] shrink-0">
                        <PageHeader
                            title={t('timeline.title')}
                            subtitle={t('timeline.subtitle')}
                        />
                    </div>

                    <div className="flex min-h-0 flex-col justify-center">
                        <p className="mb-[clamp(0.25rem,1vh,1rem)] font-display text-[clamp(1.1rem,min(2.5vw,4.5vh),2.25rem)] text-snd-terracotta">
                            {slide.milestone.year}{' '}
                            {slide.milestone.date_type
                                ? t(`enums.date_type.${slide.milestone.date_type.value}.suffix`)
                                : ''}
                        </p>

                        <h2 className="mb-[clamp(1.5rem,min(3vh,3vw),2.5rem)] max-w-[95%] font-display text-[clamp(1.5rem,min(4vw,7vh),3.75rem)] leading-[1.1] text-sand">
                            {title}
                        </h2>

                        <p className="max-w-[95%] text-[clamp(0.95rem,min(2vw,3.5vh),1.875rem)] leading-[1.6] text-sand/85">
                            {body}
                        </p>
                    </div>
                </article>
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Timeline Page Component
|--------------------------------------------------------------------------
*/

export default function TimelinePage() {
    const { t, lang } = useI18n();
    const isRtl = lang === 'ar';

    const [doc, setDoc] = useState<TimelineDoc | null>(null);
    const [holding, setHolding] = useState(false);
    const swiperRef = useRef<SwiperClass | null>(null);

    const { reignIndex, milestoneIndex, attract, set } = useTimelineNav();

    /*
    |--------------------------------------------------------------------------
    | Data & Cache Loading
    |--------------------------------------------------------------------------
    */

    const loadTimeline = useCallback(async (): Promise<void> => {
        let loaded: TimelineDoc | null = null;
        try {
            loaded = await api.getTimeline();
            localStorage.setItem(CACHE_KEY, JSON.stringify(loaded));
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
                                    set({ attract: true, reignIndex: 0, milestoneIndex: 0 });
                                    void loadTimeline();
                                    break;
                            }
                        },
                    },
                );
            } catch {}
        };

        void boot();
        return () => {
            cancelled = true;
            screenUnsubscribe?.();
        };
    }, [set, loadTimeline]);

    /*
    |--------------------------------------------------------------------------
    | Slides Setup
    |--------------------------------------------------------------------------
    */

    const flatSlides: FlatSlide[] = doc
        ? doc.data.flatMap((reign, rIdx) =>
            reign.milestones.map((milestone, mIdx) => ({
                reignIndex: rIdx,
                milestoneIndex: mIdx,
                reign,
                milestone,
            })),
        )
        : [];

    const activeIndex = flatSlides.findIndex(
        (s) => s.reignIndex === reignIndex && s.milestoneIndex === milestoneIndex,
    );

    const touch = useCallback(() => {
        if (holding) return;
        if (useTimelineNav.getState().attract) {
            set({ attract: false });
        }
    }, [set, holding]);

    /*
    |--------------------------------------------------------------------------
    | Sync Swiper with Rail Navigation
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (swiperRef.current && activeIndex !== -1 && swiperRef.current.activeIndex !== activeIndex) {
            swiperRef.current.slideTo(activeIndex);
        }
    }, [activeIndex]);

    /*
    |--------------------------------------------------------------------------
    | Keyboard Navigation & Idle Timeout
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (attract || holding || !swiperRef.current) return;
            if (e.key === 'ArrowRight') {
                isRtl ? swiperRef.current.slidePrev() : swiperRef.current.slideNext();
            } else if (e.key === 'ArrowLeft') {
                isRtl ? swiperRef.current.slideNext() : swiperRef.current.slidePrev();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [attract, holding, isRtl]);

    useEffect(() => {
        if (holding) return;

        let timer = setTimeout(
            () => set({ attract: true, reignIndex: 0, milestoneIndex: 0 }),
            IDLE_MS,
        );

        const bump = () => {
            clearTimeout(timer);
            timer = setTimeout(
                () => set({ attract: true, reignIndex: 0, milestoneIndex: 0 }),
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
    | Renders
    |--------------------------------------------------------------------------
    */

    if (!doc) {
        return (
            <Stage>
                <SndPatternFrame className="snd-grid flex h-full w-full items-center justify-center bg-night text-5xl" side={false} bottom={false}>
                    {t('common.loading')}
                </SndPatternFrame>
            </Stage>
        );
    }

    if (holding) {
        return (
            <Stage>
                <div className="snd-grid relative h-full w-full bg-night">
                    <SndPatternFrame
                        className="flex h-full w-full flex-col items-center justify-center gap-[clamp(1rem,min(3vh,2vw),2rem)] px-[clamp(1rem,4vw,6rem)] py-[clamp(1.5rem,5vh,4rem)]"
                        side={false}
                        bottom={false}
                    >
                        <WaveOverlay className="opacity-40" />
                        <MessageTitleRail title="اليوم الوطني السعودي ٩٦" className="relative z-10" />
                        <p className="relative z-10 text-[clamp(0.9rem,min(2vw,3.5vh),1.875rem)] leading-tight text-center text-sand/55">
                            SATORP · Saudi National Day 96
                        </p>
                        <MotifTriple className="relative z-10" tone="cyan" />
                        <CoBrand tone="dark" divider={false} logoHeight={56} className="relative z-10 mt-[clamp(0.25rem,min(1vh,1vw),1rem)]" />
                    </SndPatternFrame>
                </div>
            </Stage>
        );
    }

    if (attract) {
        return (
            <Stage>
                <div className="relative h-full w-full">
                    <div className="pointer-events-auto absolute top-4 end-4 z-50 hidden md:block">
                        <LangToggle variant="segmented" tone="dark"/>
                    </div>
                    <button
                        type="button"
                        className="snd-grid relative flex h-full w-full flex-col overflow-hidden bg-night"
                        onClick={touch}
                    >
                        <SndPatternFrame className="flex h-full w-full flex-col" side={false} bottom={false}>
                            <WaveOverlay />
                            <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-[clamp(1rem,4vw,6rem)] py-[clamp(2rem,6vh,5rem)] text-center">
                                <CoBrand tone="dark" divider={false} logoHeight={80} className="mb-[clamp(1.5rem,min(4vh,3vw),3rem)] gap-[clamp(1rem,min(3vw,5vh),3rem)]" />
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

    return (
        <Stage>
            <div
                className="relative flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden bg-night select-none"
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                <div className="pointer-events-auto absolute bottom-4 end-4 z-50 hidden md:block">
                    <LangToggle variant="segmented" tone="dark"/>
                </div>

                {/* Swiper Real-time Slider */}
                <div className="relative h-full w-full min-h-0 min-w-0 flex-1 overflow-hidden bg-night">
                    <Swiper
                        key={isRtl ? 'rtl' : 'ltr'}
                        dir={isRtl ? 'rtl' : 'ltr'}
                        onSwiper={(swiper) => {
                            swiperRef.current = swiper;
                        }}
                        initialSlide={activeIndex !== -1 ? activeIndex : 0}
                        spaceBetween={0}
                        slidesPerView={1}
                        speed={450}
                        grabCursor={true}
                        onSlideChange={(swiper) => {
                            const slide = flatSlides[swiper.activeIndex];
                            if (slide) {
                                set({
                                    reignIndex: slide.reignIndex,
                                    milestoneIndex: slide.milestoneIndex,
                                });
                            }
                        }}
                        className="h-full w-full"
                    >
                        {flatSlides.map((slide) => (
                            <SwiperSlide key={`${slide.reign.id}-${slide.milestone.id}`} className="h-full w-full">
                                <SlideView slide={slide} isRtl={isRtl} t={t} />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>

                {/* Top Timeline Navigation Rail Overlay */}
                <nav
                    aria-label={t('timeline.title')}
                    className="pointer-events-none absolute inset-x-0 top-0 z-30 w-full lg:h-[25%] bg-gradient-to-b from-night via-night/85 to-transparent px-[clamp(0.5rem,2vw,2.5rem)] pt-[clamp(0.5rem,1vh,1rem)] pb-[clamp(2rem,6vh,5rem)]"
                >
                    <div className="pointer-events-auto w-full min-w-0 overflow-hidden">
                        <TimelineRail
                            reigns={doc.data}
                            lang={lang}
                            reignIndex={reignIndex}
                            milestoneIndex={milestoneIndex}
                            onSelect={(r, m) => {
                                const newIdx = flatSlides.findIndex(
                                    (s) => s.reignIndex === r && s.milestoneIndex === m,
                                );
                                if (newIdx !== -1 && swiperRef.current) {
                                    swiperRef.current.slideTo(newIdx);
                                }
                            }}
                        />
                    </div>
                </nav>
            </div>
        </Stage>
    );
}