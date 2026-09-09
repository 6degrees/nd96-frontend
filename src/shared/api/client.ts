import {z} from 'zod';
import {
    ConfigSchema,
    MessagesPageSchema,
    ScreenStateSchema,
    StatsSchema,
    TimelineSchema,
    type EventConfig,
    type ApiMessage,
    type MessagesPage,
    type NewMessage,
    type ScreenCommand,
    type ScreenState,
    type Stats,
    type TimelineDoc, ApiMessageSchema,
} from './types';

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

const MOCK = process.env.NEXT_PUBLIC_API_MODE === 'mock';

/*
|--------------------------------------------------------------------------
| Mock Server
|--------------------------------------------------------------------------
|
| Ensures MSW is ready before making the first API request.
|
*/

let mocksReady: Promise<void> | null = null;

function ensureMocks(): Promise<void> {
    if (!MOCK || typeof window === 'undefined') return Promise.resolve();

    if (!mocksReady) {
        mocksReady = import('@/mocks/browser').then((m) => m.startMocks());
    }

    return mocksReady;
}

/*
|--------------------------------------------------------------------------
| API Error
|--------------------------------------------------------------------------
|
| Handles Laravel's native validation error response.
|
*/

export class ApiError extends Error {
    status: number;
    code?: string;
    errors?: Record<string, string[]>;
    localized?: Record<string, string>;

    constructor(status: number, body: Record<string, unknown>) {
        super(
            typeof body.message === 'string'
                ? body.message
                : `HTTP ${status}`
        );

        this.status = status;

        if (typeof body.code === 'string') {
            this.code = body.code;
        }

        if (body.errors) {
            this.errors = body.errors as Record<string, string[]>;
        }

        if (body.localized) {
            this.localized = body.localized as Record<string, string>;
        }
    }
}

/*
|--------------------------------------------------------------------------
| API Request
|--------------------------------------------------------------------------
|
| Centralizes:
| - Mock initialization
| - Request headers
| - FormData handling
| - Authentication credentials
| - Request timeout
| - API error handling
| - Response validation
|
*/

async function request<T>(
    path: string,
    schema: z.ZodType<T> | null,
    init: RequestInit = {},
    timeoutMs = 15_000,
): Promise<T> {
    await ensureMocks();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const isFormData = init.body instanceof FormData;

        const headers = new Headers(init.headers);
        headers.set('Accept', 'application/json');

        if (isFormData) {
            headers.delete('Content-Type');
        } else if (init.body) {
            headers.set('Content-Type', 'application/json');
        }

        const res = await fetch(`${BASE}${path}`, {
            ...init,
            credentials: 'same-origin',
            headers,
            signal: controller.signal,
        });

        if (!res.ok) {
            let body: Record<string, unknown> = {};

            try {
                body = await res.json();
            } catch {
                /* Non-JSON error response */
            }

            throw new ApiError(res.status, body);
        }

        if (!schema) {
            return undefined as T;
        }

        return schema.parse(await res.json());
    } finally {
        clearTimeout(timer);
    }
}

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

export const api = {
    /*
    |--------------------------------------------------------------------------
    | Config
    |--------------------------------------------------------------------------
    */
    getConfig: (): Promise<EventConfig> => request('/api/v1/config', ConfigSchema),

    /*
    |--------------------------------------------------------------------------
    | Messages
    |--------------------------------------------------------------------------
    */
    postMessage: async (input: NewMessage): Promise<Pick<ApiMessage, 'id' | 'is_active' | 'created_at'>> => {
        const formData = new FormData();

        formData.append('client_ref', input.clientRef);
        formData.append('message', input.body);
        formData.append('name', input.name);
        formData.append('language', input.language);

        if (input.department) {
            formData.append('department_id', input.department);
        }

        /*
        |--------------------------------------------------------------------------
        | Signature
        |--------------------------------------------------------------------------
        |
        | Sends the SVG signature directly as a string.
        |
        */

        formData.append('signature', input.signatureSvg);

        const response = await request('/api/v1/messages',
            z.object({
                data: z.object({
                    id: z.string(),
                    is_active: z.boolean(),
                    created_at: z.string(),
                }),
            }),
            {
                method: 'POST',
                body: formData,
            }
        );

        return {
            id: response.data.id,
            is_active: response.data.is_active,
            created_at: response.data.created_at,
        };
    },

    /*
    |--------------------------------------------------------------------------
    | Messages
    |--------------------------------------------------------------------------
    */
    getMessages: (params: { status?: string; since?: string; per_page?: number; cursor?: string} = {}): Promise<MessagesPage> => {
        const q = new URLSearchParams();

        if (params.status) q.set('status', params.status);
        if (params.since) q.set('since', params.since);
        if (params.per_page) q.set('per_page', String(params.per_page));
        if (params.cursor) q.set('cursor', params.cursor);

        const qs = q.toString();

        return request(`/api/v1/messages${qs ? `?${qs}` : ''}`, MessagesPageSchema);
    },

    /*
    |--------------------------------------------------------------------------
    | Messages
    |--------------------------------------------------------------------------
    */
    patchMessage: (id: string, patch: { body?: string; status?: 'published' | 'hidden'; }): Promise<ApiMessage> => request(`/api/v1/messages/${id}`, ApiMessageSchema, {method: 'PATCH', body: JSON.stringify(patch),}),

    /*
    |--------------------------------------------------------------------------
    | Timeline
    |--------------------------------------------------------------------------
    */

    getTimeline: (): Promise<TimelineDoc> => request('/api/v1/timelines', TimelineSchema),

    /*
    |--------------------------------------------------------------------------
    | Timeline Update
    |--------------------------------------------------------------------------
    |
    | Replaces the entire document with the provided version.
    | API returns 409 when another user has modified the document.
    |
    */

    putTimeline: (doc: TimelineDoc): Promise<TimelineDoc> =>
        request(
            '/api/v1/timeline',
            TimelineSchema,
            {
                method: 'PUT',
                body: JSON.stringify(doc),
            }
        ),

    /*
    |--------------------------------------------------------------------------
    | Screen
    |--------------------------------------------------------------------------
    */

    postScreenCommand: (cmd: ScreenCommand): Promise<void> =>
        request(
            '/api/screen/commands',
            null,
            {
                method: 'POST',
                body: JSON.stringify(cmd),
            }
        ),

    getScreenState: (): Promise<ScreenState> =>
        request('/api/screen/state', ScreenStateSchema),

    /*
    |--------------------------------------------------------------------------
    | Stats
    |--------------------------------------------------------------------------
    */

    getStats: (): Promise<Stats> =>
        request('/api/stats', StatsSchema),
};