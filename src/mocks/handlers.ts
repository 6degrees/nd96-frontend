import { http, HttpResponse } from 'msw';
import type { Message, NewMessage } from '@/shared/api/types';
import { BANNED_WORDS, addMessage, db, timelineDb } from './db';

// MSW handlers for all six REST endpoints (spec §4 / §10). Response shapes —
// including Laravel's native { message, errors } validation envelope — are
// the contract of record; the backend must match them exactly.
//
// next.config trailingSlash:true can rewrite /api/foo → /api/foo/, so routes
// use optional trailing-slash regexes.

const configPath = /\/api\/config\/?$/;
const messagesPath = /\/api\/messages\/?$/;
const messageIdPath = /\/api\/messages\/(?<id>[^/]+)\/?$/;
const timelinePath = /\/api\/timeline\/?$/;
const screenCommandsPath = /\/api\/screen\/commands\/?$/;
const statsPath = /\/api\/stats\/?$/;

export const handlers = [
  http.get(configPath, () =>
    HttpResponse.json({
      eventName: 'Saudi National Day 96',
      languages: ['ar', 'en'],
      defaultLanguage: 'ar',
      limits: { nameMax: 40, bodyMax: 180, photoMaxBytes: 8_388_608 },
      features: { departments: true },
      departments: ['Operations', 'Maintenance', 'HSE', 'Engineering', 'Finance', 'IT', 'Supply Chain'],
      wall: { featureSeconds: 8, slots: 14 },
    }),
  ),

  http.post(messagesPath, async ({ request }) => {
    const input = (await request.json()) as NewMessage;

    // Laravel-shape field validation
    const errors: Record<string, string[]> = {};
    const name = input.name?.trim() ?? '';
    const body = input.body?.trim() ?? '';
    if (name.length < 2 || name.length > 40) errors.name = ['The name must be between 2 and 40 characters.'];
    if (body.length < 10 || body.length > 180) errors.body = ['The body must be between 10 and 180 characters.'];
    if (!input.clientRef) errors.clientRef = ['The client ref field is required.'];
    if (!input.signatureSvg) errors.signatureSvg = ['The signature field is required.'];
    if (Object.keys(errors).length > 0) {
      return HttpResponse.json({ message: 'The given data was invalid.', errors }, { status: 422 });
    }

    // Word filter — same envelope, plus a code and both languages
    if (BANNED_WORDS.some((w) => body.toLowerCase().includes(w))) {
      return HttpResponse.json(
        {
          message: 'Content rejected.',
          code: 'CONTENT_REJECTED',
          errors: { body: ["This message can't be published. Please reword it."] },
          localized: {
            ar: 'لا يمكن نشر هذه الرسالة. يرجى إعادة صياغتها.',
            en: "This message can't be published. Please reword it.",
          },
        },
        { status: 422 },
      );
    }

    // Non-negotiable: dedupe on clientRef — the booth iPad WILL drop Wi-Fi
    // mid-submit and the user WILL tap Submit again (spec §4).
    if (db.clientRefs.has(input.clientRef)) {
      const existing = db.messages.find((m) => m.name === name && m.body === body);
      if (existing) return HttpResponse.json(existing, { status: 201 });
    }
    db.clientRefs.add(input.clientRef);

    const msg = addMessage({
      name,
      department: input.department,
      body,
      language: input.language,
      signatureSvg: input.signatureSvg,
      status: 'published',
    });
    return HttpResponse.json(msg, { status: 201 });
  }),

  http.get(messagesPath, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const since = url.searchParams.get('since');
    const limit = Number(url.searchParams.get('limit') ?? 200);

    let items: Message[] = db.messages;
    if (status && status !== 'all') items = items.filter((m) => m.status === status);
    if (since) items = items.filter((m) => m.createdAt > since);

    return HttpResponse.json({
      items: items.slice(0, limit),
      nextCursor: null,
      total: items.length,
    });
  }),

  http.patch(messageIdPath, async ({ params, request }) => {
    const patch = (await request.json()) as { body?: string; status?: 'published' | 'hidden' };
    const id = String(params.id);
    const msg = db.messages.find((m) => m.id === id);
    if (!msg) return HttpResponse.json({ message: 'Not found.', errors: {} }, { status: 404 });
    if (patch.body !== undefined) msg.body = patch.body;
    if (patch.status !== undefined) msg.status = patch.status; // hidden, never deleted
    return HttpResponse.json(msg);
  }),

  http.get(timelinePath, () => HttpResponse.json(timelineDb.doc)),

  http.put(timelinePath, async ({ request }) => {
    const incoming = (await request.json()) as typeof timelineDb.doc;
    // Stale version → 409; the console reloads rather than overwriting
    if (incoming.version !== timelineDb.doc.version) {
      return HttpResponse.json({ message: 'Version conflict.', errors: {} }, { status: 409 });
    }
    timelineDb.doc = { ...incoming, version: incoming.version + 1 };
    return HttpResponse.json(timelineDb.doc);
  }),

  http.post(screenCommandsPath, () => new HttpResponse(null, { status: 204 })),

  http.get(statsPath, () => {
    const published = db.messages.filter((m) => m.status === 'published');
    const byDept = new Map<string, number>();
    for (const m of published) {
      if (m.department) byDept.set(m.department, (byDept.get(m.department) ?? 0) + 1);
    }
    const topDepartments = [...byDept.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return HttpResponse.json({ messages: published.length, timelineTaps: db.timelineTaps, topDepartments });
  }),
];
