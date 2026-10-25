/**
 * Stackra file contract:
 * Purpose: `DataKey`, one data-encryption key as a `KeyProvider` hands it out: its id and its raw bytes.
 * Boundary: a type only. The id is stored beside what the key sealed so a rotated key still opens old data; the bytes
 *           stay in memory and are never logged or serialised.
 * Runtime: isomorphic
 * Governing contract: ADR 0173 (nobody reads a value); registry gaps R-27 and R-36 (owner decision 23).
 */
/** A data key and the id that names it. */
export interface DataKey {
  /** The key's id; written into the sealed form so rotation can find the key again. */
  readonly id: string;

  /** The raw key bytes. */
  readonly key: Uint8Array;
}
