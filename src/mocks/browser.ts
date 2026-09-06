import { setupWorker } from 'msw/browser';
import { addMessage, db } from './db';
import { handlers } from './handlers';
import { makeLiveMessage } from './seed';

// Event simulator: with polling as the transport, injecting rows into the
// mock DB is indistinguishable from real submissions — the poll picks them
// up exactly as it would from Laravel (spec §10).
let simulatorStarted = false;

function startSimulator() {
  const interval = Number(process.env.NEXT_PUBLIC_MOCK_FEED_MS ?? 0);
  if (!interval || simulatorStarted) return;
  simulatorStarted = true;
  const SIM_LOCK = 'nd96.mock-sim-lock';
  const simId = Math.random().toString(36).slice(2);
  let n = 0;
  setInterval(() => {
    // State is shared across tabs — exactly one tab feeds the event, via a
    // heartbeat lock, or a two-screen demo would double the message rate.
    try {
      const raw = localStorage.getItem(SIM_LOCK);
      const lock = raw ? (JSON.parse(raw) as { id: string; at: number }) : null;
      if (lock && lock.id !== simId && Date.now() - lock.at < interval * 2.5) return;
      localStorage.setItem(SIM_LOCK, JSON.stringify({ id: simId, at: Date.now() }));
    } catch {
      /* storage blocked — feed locally anyway */
    }
    db.timelineTaps += Math.floor(1 + (n % 3));
    addMessage(makeLiveMessage(n++)); // persists taps + message together
  }, interval);
}

// One worker for the whole session. React Strict Mode (and Arc) can mount twice
// in dev; calling setupWorker().start() again creates a second network that
// races the first and never resolves — blank green screen forever.
const worker = setupWorker(...handlers);
let boot: Promise<void> | null = null;

const START_TIMEOUT_MS = 12_000;
const RECOVERY_KEY = 'nd96.msw-recovery';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('MSW start timed out')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function unregisterServiceWorkers() {
  if (!('serviceWorker' in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((r) => r.unregister()));
}

async function startWorker(): Promise<void> {
  await withTimeout(
    worker.start({
      onUnhandledRequest: 'bypass', // static assets, HMR, fonts pass through
      serviceWorker: { url: '/mockServiceWorker.js' },
    }),
    START_TIMEOUT_MS,
  );
}

export function startMocks(): Promise<void> {
  if (!boot) {
    boot = (async () => {
      try {
        await startWorker();
        sessionStorage.removeItem(RECOVERY_KEY);
      } catch (err) {
        console.warn('[MSW] Service worker start failed, attempting recovery…', err);
        await unregisterServiceWorkers();

        // Arc and other Chromium profiles often keep a broken localhost worker.
        // One automatic reload after clearing it fixes most cases.
        if (!sessionStorage.getItem(RECOVERY_KEY)) {
          sessionStorage.setItem(RECOVERY_KEY, '1');
          window.location.reload();
          await new Promise<void>(() => undefined);
          return;
        }

        try {
          await startWorker();
          sessionStorage.removeItem(RECOVERY_KEY);
        } catch (retryErr) {
          sessionStorage.removeItem(RECOVERY_KEY);
          throw retryErr;
        }
      }
      startSimulator();
    })();
  }
  return boot;
}
