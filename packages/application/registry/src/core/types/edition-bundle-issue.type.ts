/**
 * Stackra file contract:
 * Purpose: `EditionBundleIssue`, one reason `checkEditionBundle` refuses an edition's bundle against its base's
 *          released modules.
 * Boundary: a type only. `base_unknown`: no released manifest of the base matches the bundle's version range;
 *           `bundled_module_unknown`: the bundle names a base module those manifests do not declare;
 *           `module_key_taken`: an edition module reuses a module key of its base.
 * Runtime: isomorphic
 * Governing contract: ADR 0335 (decisions 2, 5 and 6, enforcement); ADR 0349 (module keys checked against the base).
 */

/** One bundle failure. */
export interface EditionBundleIssue {
  /** What is wrong. */
  readonly code: "base_unknown" | "bundled_module_unknown" | "module_key_taken";

  /** The module concerned; the base product key for `base_unknown`. */
  readonly module: string;

  /** What is wrong, in English. */
  readonly message: string;
}
