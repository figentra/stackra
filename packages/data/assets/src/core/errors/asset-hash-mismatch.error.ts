/**
 * Stackra file contract:
 * Purpose: `AssetHashMismatchError`, why a module does not start: a shipped `data/` asset's bytes do not match the
 *          SHA-256 gen wrote into the manifest, so a rule pack or reference table was changed or truncated after the
 *          build.
 * Boundary: a boot failure, not a refusal: no caller can act on it, so it is never sent on the wire. It names the
 *           asset and both digests, never the contents.
 * Runtime: isomorphic
 * Governing contract: ADR 0234 (2026-10-24 note: the runtime refuses to start a module whose data does not match).
 */

/** A data asset's bytes differ from its manifest hash. */
export class AssetHashMismatchError extends Error {
  /** The asset's key. */
  readonly key: string;

  /** The hash the manifest holds. */
  readonly expected: string;

  /** The hash of the shipped bytes. */
  readonly actual: string;

  /**
   * @param key - the asset's key.
   * @param expected - the manifest's hash.
   * @param actual - the shipped bytes' hash.
   */
  constructor(key: string, expected: string, actual: string) {
    super(`${key} does not match its manifest hash (expected ${expected}, shipped ${actual})`);
    this.name = "AssetHashMismatchError";
    this.key = key;
    this.expected = expected;
    this.actual = actual;
  }
}
