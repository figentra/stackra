/**
 * Stackra file contract:
 * Purpose: `uuidToPublicId(prefix, uuid)`, the public id of a stored UUID: the model's prefix, `_`, and the 26
 *          lowercase Crockford base32 characters of the UUID's 128 bits, the same form `mintPublicId` writes.
 * Boundary: pure; the inverse of `publicIdToUuid`. Used by `PublicIdType` and `LinkType` on the way out of the
 *           database. It does not check the prefix (the trait and gen do).
 * Runtime: isomorphic
 * Governing contract: ADR 0135 (decision 1 and the 2026-10-28 amendment: native `uuid` storage); owner data-layer
 *                     decision 1 (2026-10-28).
 */
import type { PublicId } from "@stackra/contracts";

import { CROCKFORD_ALPHABET } from "#core/constants/crockford-alphabet.constant";

/** A UUID in any case, with or without hyphens. */
const UUID = /^[\da-f]{8}-?[\da-f]{4}-?[\da-f]{4}-?[\da-f]{4}-?[\da-f]{12}$/i;

/**
 * The public id of `uuid` under `prefix`.
 *
 * @throws TypeError when `uuid` is not a UUID.
 * @example
 * uuidToPublicId("ord", "0190a3b4-..."); // "ord_01jab3k4m5n6p7q8r9s0t1v2w3"
 */
export function uuidToPublicId<P extends string>(prefix: P, uuid: string): PublicId<P> {
  if (!UUID.test(uuid)) throw new TypeError(`"${uuid}" is not a UUID`);
  let value = BigInt(`0x${uuid.replaceAll("-", "")}`);
  let body = "";
  for (let index = 0; index < 26; index += 1) {
    body = CROCKFORD_ALPHABET.charAt(Number(value & 31n)) + body;
    value >>= 5n;
  }
  return `${prefix}_${body}`;
}
