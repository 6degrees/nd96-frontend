import {z} from 'zod';
import {
    ConfigSchema,
    MessageSchema,
    MessagesPageSchema,
    ScreenStateSchema,
    StatsSchema,
    TimelineSchema,
    type EventConfig,
    type Message,
    type MessagesPage,
    type NewMessage,
    type ScreenCommand,
    type ScreenState,
    type Stats,
    type TimelineDoc,
} from './types';

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';
const MOCK = process.env.NEXT_PUBLIC_API_MODE === 'mock';

// Mock mode: MSW starts in the background (AppProviders) so surfaces render
// instantly — but no API call may escape to the dev server before the worker
// owns /api. Await the memoized boot before the first fetch.
let mocksReady: Promise<void> | null = null;

function ensureMocks(): Promise<void> {
    if (!MOCK || typeof window === 'undefined') return Promise.resolve();
    if (!mocksReady) mocksReady = import('@/mocks/browser').then((m) => m.startMocks());
    return mocksReady;
}

// Laravel's native validation envelope — the one error parser the frontend needs.
export class ApiError extends Error {
    status: number;
    code?: string;
    errors?: Record<string, string[]>;
    localized?: Record<string, string>;

    constructor(status: number, body: Record<string, unknown>) {
        super(typeof body.message === 'string' ? body.message : `HTTP ${status}`);
        this.status = status;
        if (typeof body.code === 'string') this.code = body.code;
        if (body.errors) this.errors = body.errors as Record<string, string[]>;
        if (body.localized) this.localized = body.localized as Record<string, string>;
    }
}

async function request<T>(
    path: string,
    schema: z.ZodType<T> | null,
    init: RequestInit = {},
    timeoutMs = 15_000,
): Promise<T> {
    await ensureMocks()

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
        const isFormData = init.body instanceof FormData

        const headers = new Headers(init.headers)
        headers.set('Accept', 'application/json')

        if (isFormData) {
            headers.delete('Content-Type')
        } else if (init.body) {
            headers.set('Content-Type', 'application/json')
        }

        const res = await fetch(`${BASE}${path}`, {
            ...init,
            credentials: 'same-origin',
            headers,
            signal: controller.signal,
        })

        if (!res.ok) {
            let body: Record<string, unknown> = {}

            try {
                body = await res.json()
            } catch {
                /* non-JSON error body */
            }

            throw new ApiError(res.status, body)
        }

        if (!schema) return undefined as T

        return schema.parse(await res.json())
    } finally {
        clearTimeout(timer)
    }
}

export const api = {
    getConfig: (): Promise<EventConfig> => request('/api/v1/config', ConfigSchema),

    // 201 → { id, status, createdAt }
    postMessage: async (input: NewMessage): Promise<Pick<Message, 'id' | 'status' | 'createdAt'>> => {
        const formData = new FormData()

        formData.append('client_ref', input.clientRef)
        formData.append('message', input.body)
        formData.append('name', input.name)
        formData.append('language', input.language)

        if (input.department) {
            formData.append('department_id', input.department)
        }

        // Convert Base64 PNG to File
        const base64 = input.signaturePng.split(',')[1]
        const binary = atob(base64)
        const bytes = new Uint8Array(binary.length)

        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i)
        }

        const signatureFile = new File(
            [bytes],
            'signature.png',
            { type: 'image/png' }
        )

        formData.append('signature', signatureFile)

        const response = await request(
            '/api/v1/messages',
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
        )

        return {
            id: response.data.id,
            status: response.data.is_active ? 'published' : 'hidden',
            createdAt: response.data.created_at,
        }
    },

    getMessages: (params: {
        status?: string;
        since?: string;
        limit?: number;
        cursor?: string
    } = {}): Promise<MessagesPage> => {
        const q = new URLSearchParams();
        if (params.status) q.set('status', params.status);
        if (params.since) q.set('since', params.since);
        if (params.limit) q.set('limit', String(params.limit));
        if (params.cursor) q.set('cursor', params.cursor);
        const qs = q.toString();
        return request(`/api/v1/messages${qs ? `?${qs}` : ''}`, MessagesPageSchema);
    },

    patchMessage: (id: string, patch: { body?: string; status?: 'published' | 'hidden' }): Promise<Message> =>
        request(`/api/v1/messages/${id}`, MessageSchema, {method: 'PATCH', body: JSON.stringify(patch)}),

    getTimeline: (): Promise<TimelineDoc> => request('/api/timeline', TimelineSchema),

    // PUT replaces the whole document with its version; 409 = someone else edited (spec §4)
    putTimeline: (doc: TimelineDoc): Promise<TimelineDoc> =>
        request('/api/v1/timeline', TimelineSchema, {method: 'PUT', body: JSON.stringify(doc)}),

    postScreenCommand: (cmd: ScreenCommand): Promise<void> =>
        request('/api/screen/commands', null, {method: 'POST', body: JSON.stringify(cmd)}),

    // Proposed contract addition (docs/DATABASE.md) — pending Thursday sign-off
    getScreenState: (): Promise<ScreenState> => request('/api/screen/state', ScreenStateSchema),

    getStats: (): Promise<Stats> => request('/api/stats', StatsSchema),
};
