/**
 * Stackra file contract:
 * Purpose: `fetchPacks`, the start-up load: fetch each content hash a deployment names from a `PackStore` and verify
 *          it, so only packs that are stored, signed by a trusted key and stored under their own hash are served.
 * Boundary: refuses with `PackRejectedError`: `not_stored` for a hash the store lacks, `hash_mismatch` for a pack
 *           stored under another hash, and every refusal of `verifyPack`. The list of hashes and the trusted keys are
 *           deployment configuration.
 * Runtime: isomorphic
 * Governing contract: ADR 0385 (pack fetch by content hash); ADR 0370 (decision 2).
 */
import { PackRejection } from "#core/enums/pack-rejection.enum";
import { PackRejectedError } from "#core/errors/pack-rejected.error";
import { packLabel } from "#core/functions/pack-label.function";
import { verifyPack } from "#core/functions/verify-pack.function";
import type { PackStore } from "#core/ports/pack-store.port";
import type { MarketPack } from "#core/types/market-pack.type";
import type { TrustedKeys } from "#core/types/trusted-keys.type";

/**
 * The verified packs stored under `hashes`, in the same order.
 *
 * @example
 * const packs = await fetchPacks(store, config.packHashes, config.trustedKeys);
 */
export async function fetchPacks(
  store: PackStore,
  hashes: readonly string[],
  keys: TrustedKeys,
): Promise<MarketPack[]> {
  const packs: MarketPack[] = [];
  for (const hash of hashes) {
    const input = await store.get(hash);
    if (input === null || input === undefined)
      throw PackRejectedError.create({ reason: PackRejection.NotStored, pack: hash });
    const pack = await verifyPack(input, keys);
    if ((input as { hash: string }).hash !== hash)
      throw PackRejectedError.create({ reason: PackRejection.HashMismatch, pack: packLabel(pack) });
    packs.push(pack);
  }
  return packs;
}
