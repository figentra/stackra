/**
 * Stackra file contract:
 * Purpose: `signPack`, the build step that turns a reviewed pack version into the `SignedPack` that ships: it checks
 *          the pack, hashes its canonical JSON and signs the hash with an Ed25519 private key.
 * Boundary: the private key is a `CryptoKey` the caller holds (a build or release step); this package never reads,
 *           stores or logs it. Throws a `ZodError` for a pack of the wrong shape. Uses Web Crypto.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 2).
 */
import { MARKET_PACK_SCHEMA } from "#core/constants/market-pack-schema.constant";
import { contentHash } from "#core/functions/content-hash.function";
import type { MarketPack } from "#core/types/market-pack.type";
import type { SignedPack } from "#core/types/signed-pack.type";

/**
 * Sign `pack` with `privateKey`, recording `keyId` so a verifier can find the public key.
 *
 * @example
 * const signed = await signPack(pack, "release-2026", privateKey);
 */
export async function signPack(
  pack: MarketPack,
  keyId: string,
  privateKey: CryptoKey,
): Promise<SignedPack> {
  const checked = MARKET_PACK_SCHEMA.parse(pack);
  const hash = await contentHash(checked);
  const signature = new Uint8Array(
    await crypto.subtle.sign("Ed25519", privateKey, new TextEncoder().encode(hash)),
  );
  return {
    pack: checked,
    hash,
    signature: { keyId, value: btoa(String.fromCodePoint(...signature)) },
  };
}
