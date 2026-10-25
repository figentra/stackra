/**
 * Stackra file contract:
 * Purpose: `freezeIds()`: makes generated ids deterministic for the current test by replacing
 *          `crypto.getRandomValues` with a seeded generator, then restores the real source when the test finishes.
 * Boundary: seeds the platform random source only and imports no id minting, so it stays generic (ADR 0269
 *           decision 2). `crypto.randomUUID` is not covered. Pair it with `freezeClock` for time-ordered ids.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 2: id fakes live in `.`).
 */
import { vi } from "vitest";
import { restoreAfterTest } from "#core/functions/restore-after-test.function";

/** The fixed seed: every `freezeIds()` call replays the same byte stream. */
const SEED = 0x5eed_1d5;

/**
 * Replaces `crypto.getRandomValues` with a mulberry32 stream from a fixed seed until the current test finishes. Each
 * call restarts the stream, so the same test makes the same ids on every run.
 *
 * @returns a function that restores the real random source at once.
 * @example
 * freezeIds();
 * const first = crypto.getRandomValues(new Uint8Array(4));
 * freezeIds();
 * expect(crypto.getRandomValues(new Uint8Array(4))).toEqual(first);
 */
export function freezeIds(): () => void {
  let state = SEED;
  const nextByte = (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) & 0xff;
  };
  const fill = <T extends ArrayBufferView | null>(array: T): T => {
    if (array) {
      const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
      for (let i = 0; i < bytes.length; i++) bytes[i] = nextByte();
    }
    return array;
  };
  const spy = vi.spyOn(globalThis.crypto, "getRandomValues").mockImplementation(fill);
  return restoreAfterTest(() => spy.mockRestore());
}
