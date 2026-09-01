import { z } from 'zod';
import {
  ConfigSchema,
  MessageSchema,
  MessagesPageSchema,
  StatsSchema,
  TimelineSchema,
  type EventConfig,
  type Message,
  type MessagesPage,
  type NewMessage,
  type ScreenCommand,
  type Stats,
  type TimelineDoc,
} from './types';

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

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
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, {
      credentials: 'same-origin', // Sanctum cookie auth when served from Laravel public/app/
      headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
      signal: controller.signal,
      ...init,
    });
    if (!res.ok) {
      let body: Record<string, unknown> = {};
      try {
        body = await res.json();
      } catch {
        /* non-JSON error body */
      }
      throw new ApiError(res.status, body);
    }
    if (!schema) return undefined as T;
    return schema.parse(await res.json());
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  getConfig: (): Promise<EventConfig> => request('/api/config', ConfigSchema),

  // 201 → { id, status, createdAt } (spec §4)
  postMessage: (input: NewMessage): Promise<Pick<Message, 'id' | 'status' | 'createdAt'>> =>
    request('/api/messages', MessageSchema.pick({ id: true, status: true, createdAt: true }), {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  getMessages: (params: { status?: string; since?: string; limit?: number; cursor?: string } = {}): Promise<MessagesPage> => {
    const q = new URLSearchParams();
    if (params.status) q.set('status', params.status);
    if (params.since) q.set('since', params.since);
    if (params.limit) q.set('limit', String(params.limit));
    if (params.cursor) q.set('cursor', params.cursor);
    const qs = q.toString();
    return request(`/api/messages${qs ? `?${qs}` : ''}`, MessagesPageSchema);
  },

  patchMessage: (id: string, patch: { body?: string; status?: 'published' | 'hidden' }): Promise<Message> =>
    request(`/api/messages/${id}`, MessageSchema, { method: 'PATCH', body: JSON.stringify(patch) }),

  getTimeline: (): Promise<TimelineDoc> => request('/api/timeline', TimelineSchema),

  // PUT replaces the whole document with its version; 409 = someone else edited (spec §4)
  putTimeline: (doc: TimelineDoc): Promise<TimelineDoc> =>
    request('/api/timeline', TimelineSchema, { method: 'PUT', body: JSON.stringify(doc) }),

  postScreenCommand: (cmd: ScreenCommand): Promise<void> =>
    request('/api/screen/commands', null, { method: 'POST', body: JSON.stringify(cmd) }),

  getStats: (): Promise<Stats> => request('/api/stats', StatsSchema),
};
