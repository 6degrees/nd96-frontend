import type { Message, TimelineDoc } from '@/shared/api/types';
import { makeSeed } from './seed';

// In-memory state behind the MSW handlers. This IS the executable form of
// the contract — a disagreement surfaces the day the real endpoint arrives,
// not the week before the event (spec §10).

export const db = {
  messages: makeSeed(200) as Message[], // newest first
  clientRefs: new Set<string>(),
  timelineTaps: 431,
  nextId: 1,
};

// Demo word filter — the REAL list lives in Laravel; this only exists so the
// CONTENT_REJECTED path can be built and demonstrated against mocks.
export const BANNED_WORDS = ['badword', 'ممنوع'];

export function addMessage(msg: Omit<Message, 'id' | 'createdAt'>): Message {
  const full: Message = {
    ...msg,
    id: `msg_${String(db.nextId++).padStart(5, '0')}`,
    createdAt: new Date().toISOString(),
  };
  db.messages.unshift(full);
  return full;
}

const MILESTONE_TITLES: Array<[string, string]> = [
  ['توحيد المملكة', 'Unification of the Kingdom'],
  ['اكتشاف النفط', 'Discovery of oil'],
  ['نهضة الطاقة', 'The energy renaissance'],
];

function seedTimeline(): TimelineDoc {
  // Seven reigns, three milestones each — 21 nodes (count pending SATORP
  // written confirmation; the 25 August proposal contradicted itself on it).
  const reigns = Array.from({ length: 7 }, (_, r) => ({
    id: `r${r + 1}`,
    hijriFrom: 1351 + r * 15,
    hijriTo: r === 6 ? null : 1351 + (r + 1) * 15,
    nameAr: `الملك ${r + 1}`,
    nameEn: `King ${r + 1}`,
    portrait: `/assets/timeline/r${r + 1}.webp`,
    milestones: Array.from({ length: 3 }, (_, m) => ({
      id: `r${r + 1}m${m + 1}`,
      year: 1357 + r * 15 + m * 4,
      titleAr: MILESTONE_TITLES[m][0],
      titleEn: MILESTONE_TITLES[m][1],
      bodyAr: 'نصّ تجريبي يصف هذه المحطة التاريخية بانتظار المحتوى المعتمد من سابكو.',
      bodyEn: 'Placeholder copy describing this milestone, pending the approved content file.',
      image: `/assets/timeline/r${r + 1}m${m + 1}.webp`,
    })),
  }));
  return { version: 7, reigns };
}

export const timelineDb: { doc: TimelineDoc } = { doc: seedTimeline() };
