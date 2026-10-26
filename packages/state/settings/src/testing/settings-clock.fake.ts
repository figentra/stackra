/**
 * Stackra file contract:
 * Purpose: `SettingsClockFake`, the `Clock` a resolver fake reads: it stands at one instant until the test moves it,
 *          so scheduled revisions become due exactly when the test says.
 * Boundary: a test helper; built by `fakeResolver`. `now()` returns a new `Date` the caller owns, as the port asks.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (testing helpers per package); ADR 0213 (decision 5: scheduled revisions).
 */
import { Clock } from "@stackra/contracts";

/**
 * A clock the test sets.
 *
 * @example
 * const { clock, resolver } = fakeResolver({ now: new Date("2026-10-26T09:00:00Z") });
 * clock.at = new Date("2026-10-27T09:00:00Z");
 * await resolver.applyDue();
 */
export class SettingsClockFake extends Clock {
  /** The instant `now()` answers. */
  at: Date;

  /**
   * @param at - the starting instant.
   */
  constructor(at: Date) {
    super();
    this.at = at;
  }

  /** A copy of the instant `at` holds. */
  now(): Date {
    return new Date(this.at);
  }
}
