/**
 * Stackra file contract:
 * Purpose: `forgetPackument`: drops both cached packuments of a package.
 * Boundary: rendering and the KV cache only; read rules are the caller's.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 3, 4, 8 and 9).
 */
import type { KvNamespace } from "#src/interfaces/kv-namespace.interface";
import { packumentKey } from "#src/npm/packument-key";

/** Drops both cached packuments of a package. */
export async function forgetPackument(cache: KvNamespace, name: string): Promise<void> {
  await Promise.all([
    cache.delete(packumentKey(name, false)),
    cache.delete(packumentKey(name, true)),
  ]);
}
