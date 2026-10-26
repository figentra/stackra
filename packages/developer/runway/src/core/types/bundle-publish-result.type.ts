/**
 * Stackra file contract:
 * Purpose: `BundlePublishResult`, what `publishExtensionBundles` answers: the bundles it published and the ops
 *          contribution it held for a second reviewer.
 * Boundary: type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0436 (decisions 4 and 9: every ops publish waits for a second reviewer).
 */
import type { ExtensionBundle } from "#core/types/extension-bundle.type";
import type { PublishedBundle } from "#core/types/published-bundle.type";

/** The outcome of one publish run. */
export interface BundlePublishResult {
  /** Every bundle published, in surface order. */
  readonly published: readonly PublishedBundle[];

  /** The ops contribution, when no second reviewer approved it yet. */
  readonly held: readonly ExtensionBundle[];
}
