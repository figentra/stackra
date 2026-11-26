/**
 * Stackra file contract:
 * Purpose: `compareUpgradeVersions(a, b)`, semver precedence of two exact versions: below zero when `a` is older, zero
 *          when equal, above zero when newer. A prerelease is older than its release; prerelease identifiers compare
 *          numerically when both are numbers, else as text, and a longer list wins a tie.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145; semver 2.0.0 section 11.
 */
import { UPGRADE_VERSION_PATTERN } from "#node/upgrade/constants/upgrade-version-pattern.constant";

/** The parts of a version. */
function parts(version: string): { core: number[]; pre: string[] } {
  const match = UPGRADE_VERSION_PATTERN.exec(version);
  if (match === null) throw new Error(`not an exact version: ${version}`);
  return {
    core: [Number(match[1]), Number(match[2]), Number(match[3])],
    pre: match[4] === undefined ? [] : match[4].split("."),
  };
}

/** One prerelease identifier against another. */
function compareIdentifier(a: string, b: string): number {
  const numeric = /^\d+$/;
  if (numeric.test(a) && numeric.test(b)) return Number(a) - Number(b);
  if (numeric.test(a)) return -1;
  if (numeric.test(b)) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Compare two exact versions.
 *
 * @throws Error when either is not an exact version.
 * @example
 * compareUpgradeVersions("0.30.0", "0.4.0") > 0; // true
 * compareUpgradeVersions("1.0.0-rc.1", "1.0.0") < 0; // true
 */
export function compareUpgradeVersions(a: string, b: string): number {
  const left = parts(a);
  const right = parts(b);
  for (let index = 0; index < 3; index++) {
    const delta = (left.core[index] ?? 0) - (right.core[index] ?? 0);
    if (delta !== 0) return delta;
  }
  if (left.pre.length === 0 || right.pre.length === 0) return right.pre.length - left.pre.length;
  for (let index = 0; index < Math.min(left.pre.length, right.pre.length); index++) {
    const delta = compareIdentifier(left.pre[index] ?? "", right.pre[index] ?? "");
    if (delta !== 0) return delta;
  }
  return left.pre.length - right.pre.length;
}
