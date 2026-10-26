/**
 * Stackra file contract:
 * Purpose: `BrandCheckResult`, what one `--check` run returns.
 * Boundary: a type in the leaf entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended).
 */
import type { AssetManifest } from "#contracts/types/asset-manifest.type";
import type { BrandCheckIssue } from "#contracts/types/brand-check-issue.type";

/**
 * A check result; `ok` is true when `issues` is empty.
 *
 * @example
 * if (!result.ok) process.exitCode = 1;
 */
export interface BrandCheckResult {
  /** No issues. */
  readonly ok: boolean;

  /** Every problem found, in kit-path order. */
  readonly issues: readonly BrandCheckIssue[];

  /** The manifest a fresh build would write. */
  readonly manifest: AssetManifest;
}
