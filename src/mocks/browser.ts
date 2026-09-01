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
  let n = 0;
  setInterval(() => {
    addMessage(makeLiveMessage(n++));
    db.timelineTaps += Math.floor(1 + (n % 3));
  }, interval);
}

export async function startMocks() {
  const worker = setupWorker(...handlers);
  await worker.start({
    onUnhandledRequest: 'bypass', // static assets, HMR, fonts pass through
  });
  startSimulator();
}
