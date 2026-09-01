import { z } from 'zod';

// Single source of truth for the API contract (spec §4–§5).
// Laravel API Resources must serialise to exactly these shapes.
// Every response is validated at the boundary — a malformed payload surfaces
// as a caught error, not a blank 75″ screen.

export const LangSchema = z.enum(['ar', 'en']);
export type Lang = z.infer<typeof LangSchema>;

export const MessageSchema = z.object({
  id: z.string(),
  name: z.string(),
  department: z.string().optional(),
  body: z.string(),
  language: LangSchema,
  signatureSvg: z.string(),
  status: z.enum(['published', 'hidden']),
  createdAt: z.string(), // ISO 8601, UTC — never a local string
});
export type Message = z.infer<typeof MessageSchema>;

export const MessagesPageSchema = z.object({
  items: z.array(MessageSchema),
  nextCursor: z.string().nullable(),
  total: z.number(),
});
export type MessagesPage = z.infer<typeof MessagesPageSchema>;

export const StatsSchema = z.object({
  messages: z.number(),
  timelineTaps: z.number(),
  topDepartments: z.array(z.object({ name: z.string(), count: z.number() })),
});
export type Stats = z.infer<typeof StatsSchema>;

export const ConfigSchema = z.object({
  eventName: z.string(),
  languages: z.array(LangSchema),
  defaultLanguage: LangSchema,
  limits: z.object({
    nameMax: z.number(),
    bodyMax: z.number(),
    photoMaxBytes: z.number(),
  }),
  features: z.object({ departments: z.boolean() }),
  departments: z.array(z.string()),
  wall: z.object({ featureSeconds: z.number(), slots: z.number() }),
});
export type EventConfig = z.infer<typeof ConfigSchema>;

export const MilestoneSchema = z.object({
  id: z.string(),
  year: z.number(),
  titleAr: z.string(),
  titleEn: z.string(),
  bodyAr: z.string(),
  bodyEn: z.string(),
  image: z.string(),
});
export type Milestone = z.infer<typeof MilestoneSchema>;

export const ReignSchema = z.object({
  id: z.string(),
  hijriFrom: z.number(),
  hijriTo: z.number().nullable(),
  nameAr: z.string(),
  nameEn: z.string(),
  portrait: z.string(),
  milestones: z.array(MilestoneSchema),
});
export type Reign = z.infer<typeof ReignSchema>;

export const TimelineSchema = z.object({
  version: z.number(),
  reigns: z.array(ReignSchema),
});
export type TimelineDoc = z.infer<typeof TimelineSchema>;

export const ScreenCommandSchema = z.object({
  command: z.enum(['clear', 'holding', 'resume', 'resetEvent', 'feature']),
  payload: z.object({ messageId: z.string() }).partial().optional(),
});
export type ScreenCommand = z.infer<typeof ScreenCommandSchema>;

export interface NewMessage {
  clientRef: string; // crypto.randomUUID(); backend dedupes on it (spec §4)
  name: string;
  department?: string;
  body: string;
  language: Lang;
  signatureSvg: string;
  signaturePng: string;
}
