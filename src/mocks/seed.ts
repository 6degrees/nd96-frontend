import type { Lang, Message } from '@/shared/api/types';

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

// A placeholder squiggle so the wall renders vector signatures from day one.
const SIGNATURE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100"><path d="M20 70 C 60 10, 90 90, 130 50 S 200 20, 240 60 S 270 80, 285 55" fill="none" stroke="black" stroke-width="3" stroke-linecap="round"/></svg>';

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

export function makeSeed(count = 200, startAt = Date.now()): Message[] {
  const items: Message[] = [];
  for (let i = 0; i < count; i++) {
    const language: Lang = i % 3 === 2 ? 'en' : 'ar'; // roughly 2:1 Arabic
    items.push({
      id: `msg_seed_${String(i).padStart(4, '0')}`,
      name: language === 'ar' ? pick(AR_NAMES, i) : pick(EN_NAMES, i),
      department: i % 4 === 0 ? undefined : pick(DEPARTMENTS, i),
      body: language === 'ar' ? pick(AR_BODIES, i) : pick(EN_BODIES, i),
      language,
      signatureSvg: SIGNATURE_SVG,
      status: 'published',
      // spread backwards in time, newest first
      createdAt: new Date(startAt - i * 45_000).toISOString(),
    });
  }
  return items;
}

export function makeLiveMessage(n: number): Omit<Message, 'id' | 'createdAt'> {
  const language: Lang = n % 3 === 2 ? 'en' : 'ar';
  return {
    name: language === 'ar' ? pick(AR_NAMES, n + 3) : pick(EN_NAMES, n + 1),
    department: pick(DEPARTMENTS, n),
    body: language === 'ar' ? pick(AR_BODIES, n + 1) : pick(EN_BODIES, n + 2),
    language,
    signatureSvg: SIGNATURE_SVG,
    status: 'published',
  };
}
