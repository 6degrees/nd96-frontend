import { test } from '@playwright/test';

// The 12-hour endurance run (spec §7): 900 synthetic messages, heap sampled
// hourly, must stay ≤ 200 MB and flat. Criteria 6 and 7 cannot be
// demonstrated in a sprint review — START THIS IN WEEK ONE (spec §8).
//
// Run:  ENDURANCE=1 NEXT_PUBLIC_MOCK_FEED_MS=2000 npx playwright test tests/endurance
// (shorten DURATION_H for local smoke runs of the harness itself)

const DURATION_H = Number(process.env.ENDURANCE_HOURS ?? 12);
const HEAP_LIMIT_MB = 200;

test.skip(!process.env.ENDURANCE, 'set ENDURANCE=1 to run the endurance harness');

test('wall survives the event day', async ({ page }) => {
  test.setTimeout((DURATION_H + 1) * 3_600_000);
  await page.goto('/wall/');

  const samples: number[] = [];
  for (let hour = 0; hour <= DURATION_H; hour++) {
    if (hour > 0) await page.waitForTimeout(3_600_000);
    const heapMb = await page.evaluate(() => {
      const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
      return mem ? mem.usedJSHeapSize / 1024 / 1024 : -1;
    });
    samples.push(heapMb);
    console.log(`hour ${hour}: heap ${heapMb.toFixed(1)} MB`);
    if (heapMb > HEAP_LIMIT_MB) throw new Error(`heap ${heapMb.toFixed(1)} MB exceeds ${HEAP_LIMIT_MB} MB at hour ${hour}`);
  }

  // flatness: last sample must not exceed the first by more than 25%
  const [first] = samples;
  const last = samples[samples.length - 1];
  if (first > 0 && last > first * 1.25) {
    throw new Error(`heap grew ${(last / first - 1) * 100}% over the run — not flat`);
  }
});
