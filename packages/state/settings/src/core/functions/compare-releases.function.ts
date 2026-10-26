/**
 * Stackra file contract:
 * Purpose: `compareReleases`, the order of two platform releases (`MAJOR.MINOR.PATCH`, an optional `-pre` suffix)
 *          for the minimum release a promotion change set records: negative when `left` is older, zero when equal,
 *          positive when newer. A prerelease is older than its release.
 * Boundary: internal; pure. Refuses anything that is not a semantic version, so a malformed release never passes
 *           the check by comparing as text.
 * Runtime: isomorphic
 * Governing contract: ADR 0395 (decision 3: a change set's minimum release); ADR 0359 (open question 6).
 */

/** A semantic version: three numbers and an optional prerelease. */
const RELEASE = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

/** The parts of `release`. */
function partsOf(release: string): readonly [number, number, number, string | undefined] {
  const match = RELEASE.exec(release);
  if (match === null)
    throw new TypeError(`${JSON.stringify(release)} is not a release (MAJOR.MINOR.PATCH)`);
  return [Number(match[1]), Number(match[2]), Number(match[3]), match[4]];
}

/**
 * The order of `left` and `right`.
 *
 * @throws TypeError when either is not a release.
 * @example
 * compareReleases("1.4.0", "1.10.0") < 0; // true
 * compareReleases("2.0.0-rc.1", "2.0.0") < 0; // true
 */
export function compareReleases(left: string, right: string): number {
  const a = partsOf(left);
  const b = partsOf(right);
  for (let index = 0; index < 3; index += 1) {
    const difference = (a[index] as number) - (b[index] as number);
    if (difference !== 0) return difference;
  }
  if (a[3] === b[3]) return 0;
  if (a[3] === undefined) return 1;
  if (b[3] === undefined) return -1;
  return a[3] < b[3] ? -1 : 1;
}
