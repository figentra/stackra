/**
 * Stackra file contract:
 * Purpose: `verifyPack`, the loader's gate: it reads one shipped pack, checks its shape, recomputes the content hash
 *          over the pack exactly as shipped, and verifies the Ed25519 signature of the hash against a trusted key.
 *          Only a pack that passes all three is returned; a service whose packs fail does not start.
 * Boundary: refuses with `PackRejectedError` (`shape_invalid`, `hash_mismatch`, `key_unknown`, `signature_invalid`).
 *           A trusted key that is not a raw Ed25519 public key is a configuration fault and its Web Crypto error is
 *           thrown as is. Where the bytes come from (an asset, a file, a store) is the caller's.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 2).
 */
import { SIGNED_PACK_SCHEMA } from "#core/constants/signed-pack-schema.constant";
import { PackRejection } from "#core/enums/pack-rejection.enum";
import { PackRejectedError } from "#core/errors/pack-rejected.error";
import { contentHash } from "#core/functions/content-hash.function";
import { packLabel } from "#core/functions/pack-label.function";
import type { MarketPack } from "#core/types/market-pack.type";
import type { TrustedKeys } from "#core/types/trusted-keys.type";

/** The bytes of a base64 string. */
function bytesOf(base64: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

/**
 * The verified pack inside `input`.
 *
 * @example
 * const pack = await verifyPack(JSON.parse(text), { "release-2026": publicKeyBase64 });
 */
export async function verifyPack(input: unknown, keys: TrustedKeys): Promise<MarketPack> {
  const parsed = SIGNED_PACK_SCHEMA.safeParse(input);
  if (!parsed.success) throw PackRejectedError.create({ reason: PackRejection.ShapeInvalid });
  const { pack, hash, signature } = parsed.data;
  const label = packLabel(pack);
  // The hash covers the pack as shipped, before the schema fills any default.
  if ((await contentHash((input as { pack: unknown }).pack)) !== hash)
    throw PackRejectedError.create({ reason: PackRejection.HashMismatch, pack: label });
  const publicKey = keys[signature.keyId];
  if (publicKey === undefined)
    throw PackRejectedError.create({ reason: PackRejection.KeyUnknown, pack: label });
  const key = await crypto.subtle.importKey("raw", bytesOf(publicKey), "Ed25519", false, [
    "verify",
  ]);
  const valid = await crypto.subtle.verify(
    "Ed25519",
    key,
    bytesOf(signature.value),
    new TextEncoder().encode(hash),
  );
  if (!valid)
    throw PackRejectedError.create({ reason: PackRejection.SignatureInvalid, pack: label });
  return pack;
}
