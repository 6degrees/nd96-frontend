import type { Message, TimelineDoc } from '@/shared/api/types';
import { makeSeed } from './seed';

// In-memory state behind the MSW handlers — SHARED across tabs and windows.
// MSW handlers run in each page's own JS context, so without sharing, a booth
// window and a wall window would each have their own universe and the demo's
// core moment (submit → appears on the wall) would silently fail. State is
// persisted to localStorage and change notifications go over a
// BroadcastChannel; every tab reloads the snapshot on change, and the wall's
// 2s poll picks new messages up exactly as it would from Laravel.

const STORE_KEY = 'nd96.mockdb.v3';
const CHANNEL = 'nd96-mockdb';
const MAX_PERSISTED_MESSAGES = 500;

export type ScreenMode = 'live' | 'holding';

interface MockState {
  messages: Message[]; // newest first
  clientRefs: string[];
  timelineTaps: number;
  nextId: number;
  screenMode: ScreenMode;
  screenCommandSeq: number;
  screenLastCommand: 'clear' | 'resetEvent' | null;
}

function freshState(): MockState {
  return {
    messages: makeSeed(1),
    clientRefs: [],
    timelineTaps: 12,
    nextId: 1,
    screenMode: 'live',
    screenCommandSeq: 0,
    screenLastCommand: null,
  };
}

function loadState(): MockState {
  if (typeof window === 'undefined') return freshState();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as MockState;
  } catch {
    /* corrupted or blocked storage → reseed */
  }
  return freshState();
}

const state = loadState();

export const db = {
  get messages() {
    return state.messages;
  },
  set messages(v: Message[]) {
    state.messages = v;
  },
  clientRefs: new Set(state.clientRefs),
  get timelineTaps() {
    return state.timelineTaps;
  },
  set timelineTaps(v: number) {
    state.timelineTaps = v;
  },
  get nextId() {
    return state.nextId;
  },
  set nextId(v: number) {
    state.nextId = v;
  },
  get screen() {
    return {
      mode: state.screenMode,
      commandSeq: state.screenCommandSeq,
      lastCommand: state.screenLastCommand,
    };
  },
};

const channel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL) : null;

/** Persist the current state and tell every other tab to reload it. */
export function persist(): void {
  if (typeof window === 'undefined') return;
  state.clientRefs = [...db.clientRefs];
  state.messages = state.messages.slice(0, MAX_PERSISTED_MESSAGES);
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked — the local tab still works */
  }
  channel?.postMessage('changed');
}

// Another tab wrote — swap in its snapshot. The next poll tick (≤2s) delivers
// any new messages to the surfaces, exactly like a backend would.
channel?.addEventListener('message', (e) => {
  if (e.data !== 'changed') return;
  const next = loadState();
  state.messages = next.messages;
  state.timelineTaps = next.timelineTaps;
  state.nextId = next.nextId;
  state.screenMode = next.screenMode;
  state.screenCommandSeq = next.screenCommandSeq;
  state.screenLastCommand = next.screenLastCommand;
  db.clientRefs = new Set(next.clientRefs);
});

// Demo word filter — the REAL list lives in Laravel; this only exists so the
// CONTENT_REJECTED path can be built and demonstrated against mocks.
export const BANNED_WORDS = ['badword', 'ممنوع'];

export function addMessage(msg: Omit<Message, 'id' | 'createdAt'>): Message {
  const full: Message = {
    ...msg,
    id: `msg_${String(db.nextId++).padStart(5, '0')}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  state.messages.unshift(full);
  persist();
  return full;
}

export function applyScreenCommand(command: 'clear' | 'holding' | 'resume' | 'resetEvent' | 'feature'): void {
  switch (command) {
    case 'holding':
      state.screenMode = 'holding';
      break;
    case 'resume':
      state.screenMode = 'live';
      break;
    case 'clear':
      state.screenCommandSeq += 1;
      state.screenLastCommand = 'clear';
      break;
    case 'resetEvent':
      // archive, never delete — the mock hides everything and resets stats
      state.messages = state.messages.map((m) => ({ ...m, status: 'hidden' as const }));
      state.timelineTaps = 0;
      state.screenMode = 'live';
      state.screenCommandSeq += 1;
      state.screenLastCommand = 'resetEvent';
      break;
    case 'feature':
      break; // payload-driven; not simulated in the mock
  }
  persist();
}

// Reset helper for dev: localStorage.removeItem('nd96.mockdb.v3') + reload.

// Kings & Energy Journey — DRAFT editorial content, 1351 → 1448 AH,
// arriving at SATORP's own chapter and the Amiral expansion (proposal §2).
// Criterion 9: the final text must match SATORP's approved content file
// exactly — treat this as the proposal draft to put in front of them.
type MilestoneSeed = [year: number, titleAr: string, titleEn: string, bodyAr: string, bodyEn: string];
type ReignSeed = [hijriFrom: number, hijriTo: number | null, nameAr: string, nameEn: string, milestones: MilestoneSeed[]];

const REIGNS: ReignSeed[] = [
  [1351, 1373, 'الملك عبدالعزيز بن عبدالرحمن آل سعود', 'King Abdulaziz bin Abdulrahman Al Saud', [
    [1351, 'توحيد المملكة', 'Unification of the Kingdom',
      'في 21 جمادى الأولى 1351هـ (23 سبتمبر 1932م) أعلن الملك عبدالعزيز توحيد البلاد تحت اسم المملكة العربية السعودية، لتبدأ مسيرة بناء الدولة الحديثة.',
      'On 23 September 1932 (21 Jumada al-Ula 1351 AH), King Abdulaziz proclaimed the unification of the country as the Kingdom of Saudi Arabia — the beginning of the modern state.'],
    [1352, 'اتفاقية التنقيب عن النفط', 'The Oil Concession',
      'وقّعت المملكة اتفاقية الامتياز مع شركة ستاندرد أويل أوف كاليفورنيا عام 1352هـ (1933م)، لتنطلق أعمال التنقيب في المنطقة الشرقية.',
      'In 1933 the Kingdom signed the concession agreement with Standard Oil of California, opening the Eastern Province to oil exploration.'],
    [1357, 'بئر الدمام رقم 7', 'Dammam Well No. 7',
      'تدفّق النفط بكميات تجارية من بئر الدمام رقم 7 — بئر الخير — عام 1357هـ (1938م)، لتدخل المملكة عصر الطاقة من أوسع أبوابه.',
      'In 1938 oil flowed in commercial quantities from Dammam Well No. 7 — the Prosperity Well — and the Kingdom entered the age of energy.'],
  ]],
  [1373, 1384, 'الملك سعود بن عبدالعزيز', 'King Saud bin Abdulaziz', [
    [1380, 'تأسيس أوبك', 'Founding of OPEC',
      'شاركت المملكة عام 1380هـ (1960م) في تأسيس منظمة الدول المصدّرة للبترول (أوبك) عضوًا مؤسسًا، ترسيخًا لدورها في استقرار أسواق الطاقة.',
      'In 1960 the Kingdom became a founding member of OPEC, cementing its role in the stability of world energy markets.'],
    [1382, 'تأسيس بترومين', 'Petromin Established',
      'أُنشئت المؤسسة العامة للبترول والمعادن (بترومين) عام 1382هـ (1962م) لتطوير الصناعات البترولية الوطنية.',
      'The General Petroleum and Mineral Organization (Petromin) was established in 1962 to develop the national petroleum industries.'],
    [1383, 'كلية البترول والمعادن', 'College of Petroleum & Minerals',
      'افتُتحت كلية البترول والمعادن عام 1383هـ (1963م) — نواة جامعة الملك فهد للبترول والمعادن — لإعداد الكفاءات الوطنية لقطاع الطاقة.',
      'The College of Petroleum & Minerals opened in 1963 — the seed of KFUPM — preparing national talent for the energy sector.'],
  ]],
  [1384, 1395, 'الملك فيصل بن عبدالعزيز', 'King Faisal bin Abdulaziz', [
    [1385, 'سافكو: أولى البتروكيماويات', 'SAFCO: First Petrochemicals',
      'تأسست الشركة السعودية للأسمدة (سافكو) عام 1385هـ (1965م) كأول مشروع بتروكيماوي وطني، إيذانًا بعصر الصناعات التحويلية.',
      'The Saudi Arabian Fertilizer Company (SAFCO) was founded in 1965 as the first national petrochemical venture — the dawn of downstream industry.'],
    [1392, 'اتفاقية المشاركة', 'The Participation Agreement',
      'حصلت المملكة عام 1392هـ (1972م) على حصة 25% في أرامكو بموجب اتفاقية المشاركة، في خطوة تاريخية نحو السيادة على الثروة الوطنية.',
      'In 1972 the Kingdom acquired a 25% stake in Aramco under the Participation Agreement — a historic step toward sovereignty over the national resource.'],
    [1394, 'رفع الحصة إلى 60%', 'Majority Ownership',
      'ارتفعت حصة الدولة في أرامكو إلى 60% عام 1394هـ (1974م)، تمهيدًا للملكية الكاملة.',
      'The state raised its share of Aramco to 60% in 1974, paving the way to full ownership.'],
  ]],
  [1395, 1402, 'الملك خالد بن عبدالعزيز', 'King Khalid bin Abdulaziz', [
    [1395, 'الهيئة الملكية للجبيل وينبع', 'Royal Commission for Jubail & Yanbu',
      'أُنشئت الهيئة الملكية للجبيل وينبع عام 1395هـ (1975م) لبناء مدينتين صناعيتين عالميتين — الجبيل التي ستحتضن لاحقًا ساتورب.',
      'The Royal Commission for Jubail & Yanbu was created in 1975 to build two world-scale industrial cities — Jubail, later home to SATORP.'],
    [1396, 'تأسيس سابك', 'SABIC Founded',
      'تأسست الشركة السعودية للصناعات الأساسية (سابك) عام 1396هـ (1976م) لتحويل الغاز المصاحب إلى منتجات بتروكيماوية.',
      'SABIC was founded in 1976 to turn associated gas into petrochemical products.'],
    [1400, 'الملكية الكاملة لأرامكو', 'Full Ownership of Aramco',
      'اكتملت ملكية الدولة لأرامكو بنسبة 100% عام 1400هـ (1980م)، لتكتمل مسيرة السيادة على الثروة الوطنية.',
      'By 1980 the state completed 100% ownership of Aramco — sovereignty over the national resource, fulfilled.'],
  ]],
  [1402, 1426, 'الملك فهد بن عبدالعزيز', 'King Fahd bin Abdulaziz', [
    [1409, 'إعلان أرامكو السعودية', 'Saudi Aramco Established',
      'صدر المرسوم الملكي بتأسيس شركة الزيت العربية السعودية (أرامكو السعودية) عام 1409هـ (1988م) شركةً وطنيةً بإدارة سعودية.',
      'By royal decree in 1988, the Saudi Arabian Oil Company — Saudi Aramco — was established as a national company under Saudi management.'],
    [1413, 'تكامل قطاع التكرير', 'Refining Integration',
      'دُمجت شركة سمارك في أرامكو السعودية عام 1413هـ (1993م)، ليتكامل التكرير والتسويق مع الإنتاج تحت مظلة واحدة.',
      'In 1993 Samarec was merged into Saudi Aramco, integrating refining and marketing with production under one roof.'],
    [1419, 'حقل الشيبة', 'Shaybah Field',
      'بدأ الإنتاج من حقل الشيبة في قلب الربع الخالي عام 1419هـ (1998م) — إنجاز هندسي في واحدة من أقسى بيئات العالم.',
      'Production began at Shaybah, deep in the Empty Quarter, in 1998 — an engineering feat in one of the world’s harshest environments.'],
  ]],
  [1426, 1436, 'الملك عبدالله بن عبدالعزيز', 'King Abdullah bin Abdulaziz', [
    [1429, 'تأسيس ساتورب', 'SATORP Established',
      'وقّعت أرامكو السعودية وتوتال اتفاقية إنشاء شركة ساتورب عام 1429هـ (2008م) لبناء مصفاة تحويلية متكاملة في الجبيل.',
      'In 2008 Saudi Aramco and Total signed the agreement creating SATORP, to build a full-conversion refinery in Jubail.'],
    [1430, 'جامعة الملك عبدالله (كاوست)', 'KAUST',
      'افتُتحت جامعة الملك عبدالله للعلوم والتقنية عام 1430هـ (2009م) لدفع البحث العلمي في الطاقة والاستدامة.',
      'King Abdullah University of Science and Technology opened in 2009, advancing research in energy and sustainability.'],
    [1434, 'تشغيل مصفاة ساتورب', 'SATORP Refinery Startup',
      'بدأت مصفاة ساتورب في الجبيل إنتاجها عام 1434هـ (2013م) بطاقة 400 ألف برميل يوميًا، لتصبح من أحدث المصافي التحويلية في العالم.',
      'The SATORP refinery in Jubail started up in 2013 at 400,000 barrels per day — among the most advanced full-conversion refineries in the world.'],
  ]],
  [1436, null, 'الملك سلمان بن عبدالعزيز', 'King Salman bin Abdulaziz', [
    [1437, 'رؤية السعودية 2030', 'Saudi Vision 2030',
      'أُطلقت رؤية المملكة 2030 عام 1437هـ (2016م) خارطةَ طريق لتنويع الاقتصاد وتعظيم القيمة من قطاع الطاقة.',
      'Saudi Vision 2030 launched in 2016 — a roadmap to diversify the economy and maximize value from the energy sector.'],
    [1441, 'الطرح العام لأرامكو', 'The Aramco IPO',
      'سجّل الطرح العام الأولي لأرامكو السعودية عام 1441هـ (2019م) أكبر اكتتاب في التاريخ.',
      'Saudi Aramco’s 2019 initial public offering was the largest in history.'],
    [1448, 'مشروع التوسعة «أميرال»', 'The Amiral Expansion',
      'يواصل مجمع أميرال البتروكيماوي — مشروع توسعة ساتورب — رسم مستقبل التكامل بين التكرير والبتروكيماويات في الجبيل، امتدادًا لمسيرةٍ تمتد من التوحيد إلى اليوم الوطني 96.',
      'Amiral — SATORP’s petrochemical expansion — is writing the next chapter of refining–chemicals integration in Jubail: a journey that runs from unification to National Day 96.'],
  ]],
];

function seedTimeline(): TimelineDoc {
  const reigns = REIGNS.map(([hijriFrom, hijriTo, nameAr, nameEn, milestones], r) => ({
    id: `r${r + 1}`,
    hijriFrom,
    hijriTo,
    nameAr,
    nameEn,
    portrait: `/assets/timeline/r${r + 1}.webp`,
    milestones: milestones.map(([year, titleAr, titleEn, bodyAr, bodyEn], m) => ({
      id: `r${r + 1}m${m + 1}`,
      year,
      titleAr,
      titleEn,
      bodyAr,
      bodyEn,
      image: `/assets/timeline/r${r + 1}m${m + 1}.webp`,
    })),
  }));
  return { version: 8, reigns };
}

export const timelineDb: { doc: TimelineDoc } = { doc: seedTimeline() };
