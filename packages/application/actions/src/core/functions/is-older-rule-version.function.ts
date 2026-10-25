/**
 * Stackra file contract:
 * Purpose: `isOlderRuleVersion(version, oldest)`, whether a document's rule version is older than the oldest an action
 *          accepts without review, comparing dotted whole numbers part by part (`2.10` is newer than `2.9`).
 * Boundary: a pure function. A missing part counts as 0 (`2` equals `2.0`). A version that is not dotted whole numbers
 *           is treated as older, so the document is reviewed rather than trusted.
 * Runtime: isomorphic
 * Governing contract: ADR 0337 (decision 5: a document from an older version is flagged for review, never refused).
 */
import { RULE_VERSION_PATTERN } from "#core/constants/rule-version-pattern.constant";

/**
 * Whether `version` is below `oldest`.
 *
 * @example
 * isOlderRuleVersion("2.3.9", "2.4.0"); // true
 * isOlderRuleVersion("2.10", "2.9"); // false
 */
export function isOlderRuleVersion(version: string, oldest: string): boolean {
  if (!RULE_VERSION_PATTERN.test(version)) return true;
  const left = version.split(".").map(Number);
  const right = oldest.split(".").map(Number);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return difference < 0;
  }
  return false;
}
