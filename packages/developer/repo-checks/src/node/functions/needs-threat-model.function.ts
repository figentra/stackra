/**
 * Stackra file contract:
 * Purpose: `needsThreatModel(dir)`, whether a member of the Stackra repository must keep a threat model: it sits
 *          below one of `THREAT_MODEL.prefixes` or is one of `THREAT_MODEL.members` (constitution SEC10).
 * Boundary: pure; `dir` is the member's repository-relative folder.
 * Runtime: node
 * Governing contract: constitution SEC10; STA-316.
 */
import { THREAT_MODEL } from "#node/constants/threat-model.constant";

/**
 * True when the member at `dir` must keep `docs/threat-model.md`.
 *
 * @param dir - the member's repository-relative folder, such as `packages/security/iam`.
 * @example
 * needsThreatModel("packages/security/iam"); // true
 * needsThreatModel("packages/foundation/i18n"); // false
 */
export function needsThreatModel(dir: string): boolean {
  return (
    THREAT_MODEL.prefixes.some((prefix) => dir.startsWith(prefix)) ||
    THREAT_MODEL.members.includes(dir)
  );
}
