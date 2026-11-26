/**
 * Stackra file contract:
 * Purpose: `checkThreatModelIndex(path, text, dirs)`, that the platform threat model links the threat model of every
 *          member that must keep one, by its repository path (`<dir>/docs/threat-model.md`), so a reviewer reaches
 *          each member's model from the one page (constitution SEC10).
 * Boundary: pure; `text` is the platform page, undefined when it is missing; `dirs` are the members that need a model.
 * Runtime: node
 * Governing contract: constitution SEC10; STA-316.
 */
import { THREAT_MODEL } from "#node/constants/threat-model.constant";

/**
 * The platform page's findings: missing, or one per member it does not link.
 *
 * @param path - the page's repository-relative path, printed in every finding.
 * @param text - the page, or undefined when it is missing.
 * @param dirs - the repository-relative folders of the members that must keep a threat model.
 * @example
 * checkThreatModelIndex(page, "… packages/security/iam/docs/threat-model.md …", ["packages/security/iam"]); // []
 */
export function checkThreatModelIndex(
  path: string,
  text: string | undefined,
  dirs: readonly string[],
): string[] {
  if (text === undefined)
    return [
      `${path}: missing; the platform threat model links every member's model (constitution SEC10)`,
    ];
  return dirs
    .filter((dir) => !text.includes(`${dir}/${THREAT_MODEL.file}`))
    .map((dir) => `${path}: does not link ${dir}/${THREAT_MODEL.file} (constitution SEC10)`);
}
