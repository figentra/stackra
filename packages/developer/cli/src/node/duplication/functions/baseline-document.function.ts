/**
 * Stackra file contract:
 * Purpose: `baselineDocument(previous, measured)`, the duplication baseline `--update` writes: the settings of the
 *          previous baseline and the measured members (moved from `tools/scripts/duplication.mjs`).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: rule-gap B-9 (notes handover/testing/rule-gap-list.md); ADR 0022 (tests beside the code).
 */
import { DEFAULT_SETTINGS } from "#node/duplication/constants/default-settings.constant";
import type { DuplicationBaseline } from "#node/duplication/types/duplication-baseline.type";

/**
 * The new baseline document.
 *
 * @param previous - the parsed current baseline, or undefined.
 * @param measured - member folder to its percentages.
 * @example
 * baselineDocument({}, measured); // { minTokens: 50, newMemberCap: 5, members: measured }
 */
export function baselineDocument(
  previous: DuplicationBaseline | undefined,
  measured: Readonly<Record<string, { readonly src: number; readonly tests: number }>>,
): DuplicationBaseline {
  return {
    minTokens: previous?.minTokens ?? DEFAULT_SETTINGS.minTokens,
    newMemberCap: previous?.newMemberCap ?? DEFAULT_SETTINGS.newMemberCap,
    members: measured,
  };
}
