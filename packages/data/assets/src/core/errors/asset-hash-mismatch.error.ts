/**
 * Stackra file contract:
 * Purpose: `AssetHashMismatchError`, why a module does not start: a shipped `data/` asset's bytes do not match the
 *          SHA-256 gen wrote into the manifest, so a rule pack or reference table was changed or truncated after the
 *          build.
 * Boundary: a boot failure: an `Internal` refusal (`.error.ts` takes `Refusal`), so no caller can act on it and it is
 *           never sent on the wire. Its details name the asset and both digests, never the contents; its message is
 *           its code, `asset_hash_mismatch`.
 * Runtime: isomorphic
 * Governing contract: ADR 0234 (2026-10-24 note: the runtime refuses to start a module whose data does not match);
 *                     ADR 0294 (R3: `.error.ts` takes `Refusal`); STA-344.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A data asset's bytes differ from its manifest hash.
 *
 * @example
 * throw AssetHashMismatchError.create({ key: entry.key, expected: entry.hash, actual });
 */
export class AssetHashMismatchError extends Refusal({ kind: ErrorKind.Internal }) {
  /** The asset's key. */
  key!: string;

  /** The hash the manifest holds. */
  expected!: string;

  /** The hash of the shipped bytes. */
  actual!: string;
}
