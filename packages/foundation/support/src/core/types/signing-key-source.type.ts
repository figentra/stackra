/**
 * Stackra file contract:
 * Purpose: `SigningKeySource`, where signed tokens and one-time codes get their secret: the current key to sign or
 *          pepper with and an earlier key by id to verify with after a rotation.
 * Boundary: a structural type only, so @stackra/support keeps no workspace dependency: the `KeyProvider` port of
 *           @stackra/contracts (and each of its drivers) already satisfies it and is passed in as is.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); @stackra/contracts `KeyProvider`; STA-934.
 */

/** Hands out keys by id; a `KeyProvider` is one. */
export interface SigningKeySource {
  /** The key new tokens and codes are made with. */
  current: () => Promise<{ readonly id: string; readonly key: Uint8Array }>;

  /**
   * The key with this id.
   *
   * @throws when no key has the id.
   */
  byId: (id: string) => Promise<{ readonly id: string; readonly key: Uint8Array }>;
}
