/**
 * Stackra file contract:
 * Purpose: `licenceStanding`, soft enforcement (PK13): `active` until the licence or its file expires, whichever is
 *          first; `grace` for the grace period after that; `read_only` once the grace period is over. A licence whose
 *          file says `SUSPENDED` or `BANNED` (revoked by billing) is `read_only` at once.
 * Boundary: pure: the time is a parameter (default now), so a test or a `Clock` decides it. It never deletes or hides
 *           data; it only says which mode the install runs in (ADR 0178 decision 4, consequence 2).
 * Runtime: isomorphic
 * Governing contract: ADR 0178 (decisions 3 and 4).
 */
import { Duration } from "@stackra/contracts";

import { LicenceStanding } from "#core/enums/licence-standing.enum";
import type { Licence } from "#core/types/licence.type";

/** Keygen statuses that mean billing revoked the licence. */
const REVOKED: ReadonlySet<string> = new Set(["SUSPENDED", "BANNED"]);

/**
 * Where the install stands at `now`.
 *
 * @example
 * const standing = licenceStanding(licence, Duration.days(14), clock.now());
 * if (standing === LicenceStanding.Grace) banner.warn("licence expired");
 * @throws RangeError when `grace` is not a duration of zero or more.
 */
export function licenceStanding(
  licence: Pick<Licence, "status" | "expiry" | "fileExpiry">,
  grace: Duration,
  now: Date = new Date(),
): LicenceStanding {
  const graceMilliseconds = Duration.toMilliseconds(grace);
  if (!(graceMilliseconds >= 0))
    throw new RangeError(`licenceStanding needs a grace of zero or more, got "${grace}"`);
  if (REVOKED.has(licence.status)) return LicenceStanding.ReadOnly;
  const ends = [licence.expiry, licence.fileExpiry].flatMap((date) =>
    date === undefined ? [] : [date.getTime()],
  );
  if (ends.length === 0) return LicenceStanding.Active;
  const end = Math.min(...ends);
  if (now.getTime() < end) return LicenceStanding.Active;
  return now.getTime() < end + graceMilliseconds ? LicenceStanding.Grace : LicenceStanding.ReadOnly;
}
