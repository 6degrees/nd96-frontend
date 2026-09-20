import {z} from 'zod';

/*
|--------------------------------------------------------------------------
| Language
|--------------------------------------------------------------------------
*/

export const LangSchema = z.enum(['ar', 'en']);
export type Lang = z.infer<typeof LangSchema>;

/*
|--------------------------------------------------------------------------
| Department
|--------------------------------------------------------------------------
*/

export const DepartmentSchema = z.object({
    value: z.string(),
    name_ar: z.string(),
    name_en: z.string(),
    label: z.string(),
});

export type Department = z.infer<typeof DepartmentSchema>;

/*
|--------------------------------------------------------------------------
| API ApiMessage
|--------------------------------------------------------------------------
*/

export const ApiMessageSchema = z.object({
    id: z.string(),
    client_ref: z.string(),
    message: z.string(),
    name: z.string(),

    department: DepartmentSchema.nullable(),

    signature: z.object({
        svg: z.string(),
        url: z.string(),
    }).nullable(),

    language: z.string(),

    is_active: z.boolean(),

    activated_at: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
});

export type ApiMessage = z.infer<typeof ApiMessageSchema>;

/*
|--------------------------------------------------------------------------
| ApiMessage
|--------------------------------------------------------------------------
*/

export const MessageSchema = z.object({
    id: z.string(),
    name: z.string(),
    department: z.string().optional(),
    body: z.string(),
    language: LangSchema,
    signatureSvg: z.string(),
    status: z.enum(['published', 'hidden']),
    createdAt: z.string(), // ISO 8601 UTC
});

export type Message = z.infer<typeof MessageSchema>;

/*
|--------------------------------------------------------------------------
| Messages
|--------------------------------------------------------------------------
*/

export const MessagesPageSchema = z.object({
    data: z.array(ApiMessageSchema),

    links: z.object({
        first: z.string().nullable(),
        last: z.string().nullable(),
        prev: z.string().nullable(),
        next: z.string().nullable(),
    }),

    meta: z.object({
        current_page: z.number(),
        from: z.number().nullable(),
        last_page: z.number(),
        links: z.array(
            z.object({
                url: z.string().nullable(),
                label: z.string(),
                page: z.number().nullable(),
                active: z.boolean(),
            }),
        ),
        path: z.string(),
        per_page: z.number(),
        to: z.number().nullable(),
        total: z.number(),
    }),
});

export type MessagesPageResponse = z.infer<typeof MessagesPageSchema>;

export interface MessagesPage {
    data: ApiMessage[];
    links: MessagesPageResponse['links'];
    meta: MessagesPageResponse['meta'];
}

/*
|--------------------------------------------------------------------------
| Stats
|--------------------------------------------------------------------------
*/

export const StatsSchema = z.object({
    messages: z.number(),
    timelineTaps: z.number(),
    topDepartments: z.array(
        z.object({
            name: z.string(),
            count: z.number(),
        }),
    ),
});

export type Stats = z.infer<typeof StatsSchema>;

/*
|--------------------------------------------------------------------------
| Event Config
|--------------------------------------------------------------------------
*/

export const ConfigSchema = z.object({
    eventName: z.string(),
    languages: z.array(LangSchema),
    defaultLanguage: LangSchema,

    limits: z.object({
        nameMax: z.number(),
        bodyMax: z.number(),
        photoMaxBytes: z.number(),
    }),

    features: z.object({
        departments: z.boolean(),
    }),

    departments: z.array(
        z.object({
            id: z.string(),
            nameAr: z.string(),
            nameEn: z.string(),
        }),
    ),

    wall: z.object({
        featureSeconds: z.number(),
        slots: z.number(),
    }),
});

export type EventConfig = z.infer<typeof ConfigSchema>;

/*
|--------------------------------------------------------------------------
| Timeline
|--------------------------------------------------------------------------
*/

export const MilestoneSchema = z.object({
    id: z.string(),
    year: z.number().nullable(),
    title_ar: z.string().nullable(),
    title_en: z.string().nullable(),
    description_ar: z.string().nullable(),
    description_en: z.string().nullable(),
    image: z.string().nullable(),
});

export type Milestone = z.infer<typeof MilestoneSchema>;

export const ReignSchema = z.object({
    id: z.string(),
    name_ar: z.string(),
    name_en: z.string(),
    start_year: z.number(),
    end_year: z.number().nullable(),
    sort_order: z.number(),
    milestones: z.array(MilestoneSchema),
    is_active: z.boolean(),
    activated_at: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
});

export type Reign = z.infer<typeof ReignSchema>;

export const TimelineSchema = z.object({
    data: z.array(ReignSchema),
});

export type TimelineDoc = z.infer<typeof TimelineSchema>;

/*
|--------------------------------------------------------------------------
| Screen
|--------------------------------------------------------------------------
*/

export const ScreenStateSchema = z.object({
    mode: z.enum(['live', 'holding']),
    commandSeq: z.number(),
    lastCommand: z.enum(['clear', 'resetEvent']).nullable(),
});

export type ScreenState = z.infer<typeof ScreenStateSchema>;

export const ScreenCommandSchema = z.object({
    command: z.enum([
        'clear',
        'holding',
        'resume',
        'resetEvent',
        'feature',
    ]),

    payload: z.object({
        messageId: z.string(),
    }).partial().optional(),
});

export type ScreenCommand = z.infer<typeof ScreenCommandSchema>;

/*
|--------------------------------------------------------------------------
| New ApiMessage
|--------------------------------------------------------------------------
*/

export interface NewMessage {
    clientRef: string; // UUID used for backend deduplication
    name: string;
    department?: string;
    body: string;
    language: Lang;
    signatureSvg: string;
    signaturePng: string;
}