import type { Lang, ApiMessage } from '@/shared/api/types';

// Realistic bilingual seed: genuine Arabic, real name shapes, mixed-script
// bodies, varied lengths (spec §10). Also drives the endurance run at 900.

const AR_NAMES = [
  'عبدالله المطيري',
  'نورة القحطاني',
  'محمد الشهري',
  'سارة العتيبي',
  'خالد الدوسري',
  'ريم الغامدي',
  'فهد الحربي',
  'لطيفة الزهراني',
];

const EN_NAMES = ['Ahmed Alghamdi', 'Sara Alotaibi', 'Omar Hassan', 'Lina Alharbi', 'Faisal Alqahtani'];

const AR_BODIES = [
  'كل عام ووطني بخير، دام عزك يا وطن الشموخ والعطاء.',
  'من سواتر الرمال إلى مصافي الطاقة، قصة وطن لا يعرف المستحيل.',
  'فخورون بك يا وطن، وبسواعد أبنائك في SATORP التي تصنع المستقبل.',
  'عاشت المملكة العربية السعودية حرة أبية، وكل عام والوطن بألف خير.',
  'وطني الغالي، أنت الحلم والحاضر والمستقبل. دمت شامخًا.',
  'في يومك السادس والتسعين، نجدد العهد والولاء يا موطن العز.',
];

const EN_BODIES = [
  'Happy 96th National Day! Proud to be part of this journey of energy and excellence.',
  'From the desert to the world stage — what a story. Congratulations KSA!',
  'Ninety-six years of vision and hard work. Honored to contribute at SATORP.',
  'To the nation that dreams big and delivers bigger — happy National Day.',
];

const DEPARTMENTS = ['Operations', 'Maintenance', 'HSE', 'Engineering', 'Finance', 'IT', 'Supply Chain'];

/** Hand-drawn signature strokes (currentColor so they work on cream or dark). */
function sig(d: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" fill="none"><path d="${d}" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

const SIGNATURES = [
  // Soft double-hump + flick (matches the reference squiggle)
  sig('M18 72 C 48 38, 72 38, 95 58 C 118 78, 145 78, 168 52 C 188 32, 210 28, 235 48 C 248 58, 258 70, 278 36'),
  sig('M22 60 C 55 20, 80 90, 120 48 S 175 18, 210 62 S 250 88, 282 42'),
  sig('M16 68 C 40 30, 70 30, 95 62 C 115 88, 150 20, 185 55 C 210 80, 240 75, 275 40'),
  sig('M20 55 C 50 55, 60 85, 95 70 C 130 55, 140 25, 175 45 C 210 65, 230 30, 265 50 L 285 35'),
  sig('M24 75 C 45 25, 75 25, 100 70 C 120 100, 155 40, 190 60 C 220 78, 245 55, 280 45'),
  sig('M15 50 C 45 80, 75 80, 105 45 C 130 20, 160 20, 185 55 C 205 80, 240 70, 278 38'),
  sig('M28 70 C 55 45, 70 45, 90 65 C 110 85, 140 85, 165 55 C 185 35, 215 35, 245 60 L 275 42'),
  sig('M18 45 C 40 75, 70 90, 110 55 C 140 30, 170 30, 200 65 C 225 90, 255 60, 282 48'),
  sig('M22 65 C 60 15, 95 95, 140 50 S 200 15, 250 70 L 285 40'),
  sig('M16 58 C 35 40, 55 40, 75 60 C 95 80, 125 80, 150 50 C 170 28, 200 28, 230 55 C 250 72, 265 50, 285 44'),
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

export function makeSeed(count = 200, startAt = Date.now()): ApiMessage[] {
  const items: ApiMessage[] = [];
  for (let i = 0; i < count; i++) {
    const language: Lang = i % 3 === 2 ? 'en' : 'ar'; // roughly 2:1 Arabic
    items.push({
      id: `msg_seed_${String(i).padStart(4, '0')}`,
      name: language === 'ar' ? pick(AR_NAMES, i) : pick(EN_NAMES, i),
      department: i % 4 === 0 ? undefined : pick(DEPARTMENTS, i),
      body: language === 'ar' ? pick(AR_BODIES, i) : pick(EN_BODIES, i),
      language,
      signatureSvg: pick(SIGNATURES, i),
      status: 'published',
      // spread backwards in time, newest first
      createdAt: new Date(startAt - i * 45_000).toISOString(),
    });
  }
  return items;
}

export function makeLiveMessage(n: number): Omit<ApiMessage, 'id' | 'createdAt'> {
  const language: Lang = n % 3 === 2 ? 'en' : 'ar';
  return {
    name: language === 'ar' ? pick(AR_NAMES, n + 3) : pick(EN_NAMES, n + 1),
    department: pick(DEPARTMENTS, n),
    body: language === 'ar' ? pick(AR_BODIES, n + 1) : pick(EN_BODIES, n + 2),
    language,
    signatureSvg: pick(SIGNATURES, n + 5),
    status: 'published',
  };
}
