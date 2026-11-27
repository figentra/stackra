/**
 * Stackra file contract:
 * Purpose: `forgetPackument`: drops every cached packument of a package: both forms for each host the registry
 *          answers on, and the host-less keys of the version before (STA-2892).
 * Boundary: rendering and the KV cache only; read rules are the caller's.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 3, 4, 8 and 9).
 */
import type { KvNamespace } from "#src/interfaces/kv-namespace.interface";
import { legacyPackumentKey } from "#src/npm/legacy-packument-key";
import { packumentKey } from "#src/npm/packument-key";

/**
 * Drops every cached packument of `name` for `hosts`.
 *
 * @example
 * await forgetPackument(deps.cache, deps.settings.hosts, "@stackra/core");
 */
export async function forgetPackument(
  cache: KvNamespace,
  hosts: readonly string[],
  name: string,
): Promise<void> {
  const keys = [false, true].flatMap((abbreviated) => [
    legacyPackumentKey(name, abbreviated),
    ...hosts.map((host) => packumentKey(name, abbreviated, host)),
  ]);
  await Promise.all(keys.map((key) => cache.delete(key)));
}
