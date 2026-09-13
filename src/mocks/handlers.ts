import { http, HttpResponse } from 'msw';

import type {
    ApiMessage,
    NewMessage,
    ScreenCommand,
} from '@/shared/api/types';

import {
    BANNED_WORDS,
    addMessage,
    applyScreenCommand,
    db,
    persist,
    timelineDb,
} from './db';

// MSW handlers for all REST endpoints.
// API contract follows ApiMessage and Laravel response envelopes.

const configPath = /\/api\/config\/?$/;
const messagesPath = /\/api\/messages\/?$/;
const messageIdPath = /\/api\/messages\/(?<id>[^/]+)\/?$/;
const timelinePath = /\/api\/timeline\/?$/;
const screenCommandsPath = /\/api\/screen\/commands\/?$/;
const screenStatePath = /\/api\/screen\/state\/?$/;
const statsPath = /\/api\/stats\/?$/;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function toApiMessage(message: ApiMessage): ApiMessage {
    return {
        ...message,

        client_ref: message.client_ref ?? message.id,
        message: message.message ?? '',
        name: message.name ?? '',

        department: message.department ?? null,

        signature: message.signature ?? null,

        language: message.language ?? 'ar',

        is_active: message.is_active ?? true,

        activated_at: message.activated_at ?? message.created_at,

        created_at: message.created_at,
        updated_at: message.updated_at ?? message.created_at,
    };
}

function createApiMessage(
    input: NewMessage,
    id: string,
): ApiMessage {
    const now = new Date().toISOString();

    return {
        id,

        client_ref: input.clientRef,

        message: input.body,

        name: input.name,

        department: input.department
            ? {
                value: input.department,
                name_ar: input.department,
                name_en: input.department,
                label: input.department,
            }
            : null,

        signature: {
            svg: input.signatureSvg,
            url: '',
        },

        language: input.language,

        is_active: true,

        activated_at: now,

        created_at: now,

        updated_at: now,
    };
}

/*
|--------------------------------------------------------------------------
| Handlers
|--------------------------------------------------------------------------
*/

export const handlers = [
    /*
    |--------------------------------------------------------------------------
    | GET /api/config
    |--------------------------------------------------------------------------
    */

    http.get(configPath, () =>
        HttpResponse.json({
            eventName: 'Saudi National Day 96',

            languages: ['ar', 'en'],

            defaultLanguage: 'ar',

            limits: {
                nameMax: 40,
                bodyMax: 180,
                photoMaxBytes: 8_388_608,
            },

            features: {
                departments: true,
            },

            departments: [
                {
                    id: 'operations',
                    nameAr: 'العمليات',
                    nameEn: 'Operations',
                },
                {
                    id: 'maintenance',
                    nameAr: 'الصيانة',
                    nameEn: 'Maintenance',
                },
                {
                    id: 'hse',
                    nameAr: 'الصحة والسلامة والبيئة',
                    nameEn: 'HSE',
                },
                {
                    id: 'engineering',
                    nameAr: 'الهندسة',
                    nameEn: 'Engineering',
                },
                {
                    id: 'finance',
                    nameAr: 'المالية',
                    nameEn: 'Finance',
                },
                {
                    id: 'it',
                    nameAr: 'تقنية المعلومات',
                    nameEn: 'IT',
                },
                {
                    id: 'supply_chain',
                    nameAr: 'سلسلة الإمداد',
                    nameEn: 'Supply Chain',
                },
            ],

            wall: {
                featureSeconds: 8,
                slots: 14,
            },
        }),
    ),

    /*
    |--------------------------------------------------------------------------
    | POST /api/messages
    |--------------------------------------------------------------------------
    */

    http.post(messagesPath, async ({ request }) => {
        const input = (await request.json()) as NewMessage;

        const errors: Record<string, string[]> = {};

        const name = input.name?.trim() ?? '';
        const body = input.body?.trim() ?? '';

        if (name.length < 2 || name.length > 40) {
            errors.name = [
                'The name must be between 2 and 40 characters.',
            ];
        }

        if (body.length < 10 || body.length > 180) {
            errors.body = [
                'The body must be between 10 and 180 characters.',
            ];
        }

        if (!input.clientRef) {
            errors.clientRef = [
                'The client ref field is required.',
            ];
        }

        if (!input.signatureSvg) {
            errors.signatureSvg = [
                'The signature field is required.',
            ];
        }

        if (Object.keys(errors).length > 0) {
            return HttpResponse.json(
                {
                    message: 'The given data was invalid.',
                    errors,
                },
                {
                    status: 422,
                },
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Banned words
        |--------------------------------------------------------------------------
        */

        if (
            BANNED_WORDS.some((word) =>
                body.toLowerCase().includes(word.toLowerCase()),
            )
        ) {
            return HttpResponse.json(
                {
                    message: 'Content rejected.',

                    code: 'CONTENT_REJECTED',

                    errors: {
                        body: [
                            "This message can't be published. Please reword it.",
                        ],
                    },

                    localized: {
                        ar: 'لا يمكن نشر هذه الرسالة. يرجى إعادة صياغتها.',

                        en: "This message can't be published. Please reword it.",
                    },
                },
                {
                    status: 422,
                },
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Deduplication
        |--------------------------------------------------------------------------
        */

        if (db.clientRefs.has(input.clientRef)) {
            const existing = db.messages.find(
                (message: ApiMessage) =>
                    message.client_ref === input.clientRef,
            );

            if (existing) {
                return HttpResponse.json(
                    toApiMessage(existing),
                    {
                        status: 201,
                    },
                );
            }
        }

        db.clientRefs.add(input.clientRef);

        /*
        |--------------------------------------------------------------------------
        | Create API message
        |--------------------------------------------------------------------------
        */

        const msg = createApiMessage(
            {
                ...input,
                name,
                body,
            },
            `msg_${crypto.randomUUID()}`,
        );

        db.messages.push(msg);

        persist();

        return HttpResponse.json(
            msg,
            {
                status: 201,
            },
        );
    }),

    /*
    |--------------------------------------------------------------------------
    | GET /api/messages
    |--------------------------------------------------------------------------
    */

    http.get(messagesPath, ({ request }) => {
        const url = new URL(request.url);

        const status = url.searchParams.get('status');
        const since = url.searchParams.get('since');

        const limit = Math.max(
            1,
            Number(url.searchParams.get('limit') ?? 200),
        );

        let items: ApiMessage[] = db.messages;

        if (status === 'published') {
            items = items.filter(
                (message) => message.is_active === true,
            );
        }

        if (status === 'hidden') {
            items = items.filter(
                (message) => message.is_active === false,
            );
        }

        if (since) {
            items = items.filter(
                (message) => message.created_at > since,
            );
        }

        const pageItems = items
            .slice(0, limit)
            .map(toApiMessage);

        return HttpResponse.json({
            data: pageItems,

            links: {
                first: null,
                last: null,
                prev: null,
                next: null,
            },

            meta: {
                current_page: 1,

                from: pageItems.length > 0
                    ? 1
                    : null,

                last_page: 1,

                links: [],

                path: '/api/messages',

                per_page: limit,

                to: pageItems.length > 0
                    ? pageItems.length
                    : null,

                total: items.length,
            },
        });
    }),

    /*
    |--------------------------------------------------------------------------
    | PATCH /api/messages/{id}
    |--------------------------------------------------------------------------
    */

    http.patch(
        messageIdPath,
        async ({ params, request }) => {
            const patch = (await request.json()) as {
                message?: string;
                body?: string;
                is_active?: boolean;
            };

            const id = String(params.id);

            const msg = db.messages.find(
                (message: ApiMessage) => message.id === id,
            );

            if (!msg) {
                return HttpResponse.json(
                    {
                        message: 'Not found.',
                        errors: {},
                    },
                    {
                        status: 404,
                    },
                );
            }

            if (patch.message !== undefined) {
                msg.message = patch.message;
            }

            if (patch.body !== undefined) {
                msg.message = patch.body;
            }

            if (patch.is_active !== undefined) {
                msg.is_active = patch.is_active;
            }

            msg.updated_at = new Date().toISOString();

            persist();

            return HttpResponse.json(
                toApiMessage(msg),
            );
        },
    ),

    /*
    |--------------------------------------------------------------------------
    | GET /api/timeline
    |--------------------------------------------------------------------------
    */

    http.get(
        timelinePath,
        () => HttpResponse.json(timelineDb.doc),
    ),

    /*
    |--------------------------------------------------------------------------
    | PUT /api/timeline
    |--------------------------------------------------------------------------
    */

    http.put(
        timelinePath,
        async ({ request }) => {
            const incoming = (await request.json()) as typeof timelineDb.doc;


            timelineDb.doc = {
                ...incoming,

            };

            return HttpResponse.json(
                timelineDb.doc,
            );
        },
    ),

    /*
    |--------------------------------------------------------------------------
    | POST /api/screen/commands
    |--------------------------------------------------------------------------
    */

    http.post(
        screenCommandsPath,
        async ({ request }) => {
            const cmd = (await request.json()) as ScreenCommand;

            applyScreenCommand(cmd.command);

            return new HttpResponse(
                null,
                {
                    status: 204,
                },
            );
        },
    ),

    /*
    |--------------------------------------------------------------------------
    | GET /api/screen/state
    |--------------------------------------------------------------------------
    */

    http.get(
        screenStatePath,
        () => HttpResponse.json(db.screen),
    ),

    /*
    |--------------------------------------------------------------------------
    | GET /api/stats
    |--------------------------------------------------------------------------
    */

    http.get(
        statsPath,
        () => {
            const published = db.messages.filter(
                (message: ApiMessage) =>
                    message.is_active === true,
            );

            const byDept = new Map<string, number>();

            for (const message of published) {
                if (message.department) {
                    const departmentName = message.department.label;

                    byDept.set(
                        departmentName,
                        (byDept.get(departmentName) ?? 0) + 1,
                    );
                }
            }

            const topDepartments = [...byDept.entries()]
                .map(([name, count]) => ({
                    name,
                    count,
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            return HttpResponse.json({
                messages: published.length,

                timelineTaps: db.timelineTaps,

                topDepartments,
            });
        },
    ),
];