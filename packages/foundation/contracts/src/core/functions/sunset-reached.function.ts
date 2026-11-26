/**
 * Stackra file contract:
 * Purpose: `sunsetReached(sunset, now)`, whether a deprecation's sunset has come: `now` is the member's release version
 *          (gen) or today's date (a runtime that meters deprecated use), compared with a sunset of the same form.
 * Boundary: pure; a prerelease comes before its release (`0.35.0-next.1` has not reached `0.35.0`). A sunset and a
 *           `now` of different forms, or a malformed one, never count as reached.
 * Runtime: isomorphic
 * Governing contract: ADR 0131 (decision 4); ADR 0136 (decision 4); ADR 0177 (decision 6); STA-2836.
 */

/** A release version, `major.minor.patch` with an optional prerelease. */
const VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?$/;

/** A date version, `YYYY-MM-DD`. */
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** -1, 0 or 1 as version `left` comes before, equals or comes after `right`. */
function compareVersions(left: RegExpExecArray, right: RegExpExecArray): number {
  for (const index of [1, 2, 3]) {
    const difference = Number(left[index]) - Number(right[index]);
    if (difference !== 0) return Math.sign(difference);
  }
  const [leftPre, rightPre] = [left[4], right[4]];
  if (leftPre === rightPre) return 0;
  if (leftPre === undefined) return 1;
  if (rightPre === undefined) return -1;
  return leftPre < rightPre ? -1 : 1;
}

/**
 * Whether `now` is at or past `sunset`.
 *
 * @param sunset - the deprecation's sunset, a version or a date.
 * @param now - the member's version, or today as `YYYY-MM-DD`.
 * @example
 * sunsetReached("0.35.0", "0.35.0"); // true
 * sunsetReached("0.35.0", "0.35.0-next.2"); // false
 * sunsetReached("2027-05-26", "2027-06-01"); // true
 */
export function sunsetReached(sunset: string, now: string): boolean {
  const sunsetVersion = VERSION.exec(sunset);
  const nowVersion = VERSION.exec(now);
  if (sunsetVersion !== null && nowVersion !== null)
    return compareVersions(nowVersion, sunsetVersion) >= 0;
  return DATE.test(sunset) && DATE.test(now) && now >= sunset;
}
