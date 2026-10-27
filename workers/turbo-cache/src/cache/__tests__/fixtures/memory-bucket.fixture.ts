/**
 * Stackra file contract:
 * Purpose: test fixture: `memoryBucket()`, an in-memory stand-in for the R2 binding (head, get, put) with `seed` for
 *          writing an object at a chosen upload time, and `keys()` listing what is stored.
 * Boundary: test only; no R2, no network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement).
 */
import type { TurboCacheBucket, TurboCacheObjectBody } from "#src/interfaces";

/** One stored object. */
type Stored = {
  readonly bytes: Uint8Array<ArrayBuffer>;
  readonly uploaded: Date;
  readonly customMetadata: Record<string, string>;
};

/** The stand-in bucket plus its test helpers. */
export type MemoryBucket = TurboCacheBucket & {
  seed(key: string, text: string, options?: Partial<Omit<Stored, "bytes">>): void;
  keys(): string[];
};

/** A fresh, empty stand-in bucket. */
export function memoryBucket(): MemoryBucket {
  const objects = new Map<string, Stored>();
  const meta = (stored: Stored) => ({
    size: stored.bytes.byteLength,
    uploaded: stored.uploaded,
    customMetadata: stored.customMetadata,
  });
  return {
    head: async (key) => {
      const stored = objects.get(key);
      return stored === undefined ? null : meta(stored);
    },
    get: async (key): Promise<TurboCacheObjectBody | null> => {
      const stored = objects.get(key);
      return stored === undefined
        ? null
        : { ...meta(stored), body: new Blob([stored.bytes]).stream() };
    },
    put: async (key, value, options) => {
      const bytes = new Uint8Array(await new Response(value).arrayBuffer());
      objects.set(key, {
        bytes,
        uploaded: new Date(),
        customMetadata: { ...options.customMetadata },
      });
    },
    seed: (key, text, options = {}) => {
      objects.set(key, {
        bytes: new TextEncoder().encode(text),
        uploaded: options.uploaded ?? new Date(),
        customMetadata: options.customMetadata ?? {},
      });
    },
    keys: () => [...objects.keys()],
  };
}
