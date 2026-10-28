/**
 * Stackra file contract:
 * Purpose: `publicIdToUuid(id)`, the stored form of a public id: the UUIDv7 its 26 Crockford base32 characters encode,
 *          as the canonical hyphenated lowercase string a Postgres `uuid` column takes. The prefix is dropped; the
 *          column's model knows it.
 * Boundary: pure; the inverse of `uuidToPublicId`. Used by `PublicIdType` and `LinkType` on the way into the database.
 * Runtime: isomorphic
 * Governing contract: ADR 0135 (decision 1 and the 2026-10-28 amendment: native `uuid` storage); owner data-layer
 *                     decision 1 (2026-10-28).
 */
import { CROCKFORD_ALPHABET } from "#core/constants/crockford-alphabet.constant";

/** A public id: 2 to 6 lowercase letters, `_`, 26 Crockford base32 characters. */
const PUBLIC_ID = /^[a-z]{2,6}_([0-9a-hjkmnp-tv-z]{26})$/;

/**
 * The UUID a public id encodes.
 *
 * @throws TypeError when `id` is not a public id, or its body is wider than 128 bits.
 * @example
 * publicIdToUuid("ord_01jab3k4m5n6p7q8r9s0t1v2w3"); // "0190..." (8-4-4-4-12 hex)
 */
export function publicIdToUuid(id: string): string {
  const body = PUBLIC_ID.exec(id)?.[1];
  if (body === undefined) throw new TypeError(`"${id}" is not a public id`);
  let value = 0n;
  for (const character of body)
    value = (value << 5n) | BigInt(CROCKFORD_ALPHABET.indexOf(character));
  if (value >> 128n !== 0n) throw new TypeError(`"${id}" does not encode a UUID`);
  const hex = value.toString(16).padStart(32, "0");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
