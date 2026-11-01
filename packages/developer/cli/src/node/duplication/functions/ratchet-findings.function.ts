/**
 * Stackra file contract:
 * Purpose: `ratchetFindings(baseline, measured)`, the duplication ratchet findings: a member whose source percentage
 *          rose above its baseline row, or a member without a row above `newMemberCap`; a drop passes. A baseline
 *          whose `members` is not generated yet yields none (moved from `tools/scripts/duplication.mjs`).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: rule-gap B-9 (notes handover/testing/rule-gap-list.md); ADR 0022 (tests beside the code).
 */
import { BASELINE_PATH } from "#node/duplication/constants/baseline-path.constant";
import { DEFAULT_SETTINGS } from "#node/duplication/constants/default-settings.constant";
import type { DuplicationBaseline } from "#node/duplication/types/duplication-baseline.type";
import type { DirFinding } from "#node/types/dir-finding.type";

/**
 * The findings of `measured` against `baseline`.
 *
 * @param baseline - the parsed baseline, or undefined.
 * @param measured - member folder to its percentages.
 * @example
 * ratchetFindings({ minTokens: 50 }, { "packages/data/a": { src: 90, tests: 0 } }); // []
 */
export function ratchetFindings(
  baseline: DuplicationBaseline | undefined,
  measured: Readonly<Record<string, { readonly src: number; readonly tests: number }>>,
): DirFinding[] {
  const members = baseline?.members;
  if (!members || typeof members !== "object") return [];
  const cap = Number(baseline.newMemberCap ?? DEFAULT_SETTINGS.newMemberCap);
  const findings: DirFinding[] = [];
  for (const [dir, { src }] of Object.entries(measured)) {
    const known = members[dir]?.src;
    if (typeof known === "number" && src > known)
      findings.push({
        dir,
        text: `duplication rose from ${known}% to ${src}% of src (jscpd --min-tokens ${baseline.minTokens ?? DEFAULT_SETTINGS.minTokens}); remove the copy, or refresh ${BASELINE_PATH} with the owner's approval`,
      });
    else if (typeof known !== "number" && src > cap)
      findings.push({
        dir,
        text: `duplication is ${src}% of src, above the ${cap}% cap for a member not in ${BASELINE_PATH}`,
      });
  }
  return findings;
}
