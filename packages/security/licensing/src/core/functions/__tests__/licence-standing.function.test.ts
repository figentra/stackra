/**
 * Stackra file contract:
 * Purpose: unit tests of `licenceStanding`: active before the earlier of licence and file expiry, grace for the grace
 *          period after it, read-only past it; perpetual licences stay active; suspended and banned licences are
 *          read-only at once; a bad grace is a RangeError.
 * Boundary: test only; the time is passed in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0178 (decision 4, enforcement: expiry is tested).
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { LicenceStanding } from "#core/enums/licence-standing.enum";
import { licenceStanding } from "#core/functions/licence-standing.function";

const EXPIRY = new Date("2027-01-01T00:00:00.000Z");
const GRACE = Duration.days(14);

/** A licence that expires at `EXPIRY` and whose file never does. */
const licence = { status: "ACTIVE", expiry: EXPIRY, fileExpiry: undefined };

describe("licenceStanding", () => {
  it("is active before the expiry", () => {
    expect(licenceStanding(licence, GRACE, new Date("2026-12-31T23:59:59.000Z"))).toBe(
      LicenceStanding.Active,
    );
  });

  it("is in grace from the expiry until the grace period ends", () => {
    expect(licenceStanding(licence, GRACE, EXPIRY)).toBe(LicenceStanding.Grace);
    expect(licenceStanding(licence, GRACE, new Date("2027-01-14T23:59:59.000Z"))).toBe(
      LicenceStanding.Grace,
    );
  });

  it("is read-only once the grace period is over", () => {
    expect(licenceStanding(licence, GRACE, new Date("2027-01-15T00:00:00.000Z"))).toBe(
      LicenceStanding.ReadOnly,
    );
  });

  it("goes straight to read-only with no grace", () => {
    expect(licenceStanding(licence, Duration.seconds(0), EXPIRY)).toBe(LicenceStanding.ReadOnly);
  });

  it("counts from the file expiry when it comes first", () => {
    const checkedOut = { ...licence, fileExpiry: new Date("2026-11-01T00:00:00.000Z") };
    expect(licenceStanding(checkedOut, GRACE, new Date("2026-11-02T00:00:00.000Z"))).toBe(
      LicenceStanding.Grace,
    );
  });

  it("keeps a perpetual licence active", () => {
    const perpetual = { status: "ACTIVE", expiry: undefined, fileExpiry: undefined };
    expect(licenceStanding(perpetual, GRACE, new Date("2099-01-01T00:00:00.000Z"))).toBe(
      LicenceStanding.Active,
    );
  });

  it("makes a suspended or banned licence read-only at once", () => {
    const early = new Date("2026-06-01T00:00:00.000Z");
    expect(licenceStanding({ ...licence, status: "SUSPENDED" }, GRACE, early)).toBe(
      LicenceStanding.ReadOnly,
    );
    expect(licenceStanding({ ...licence, status: "BANNED" }, GRACE, early)).toBe(
      LicenceStanding.ReadOnly,
    );
  });

  it("uses the current time when none is given", () => {
    const perpetual = { status: "ACTIVE", expiry: undefined, fileExpiry: undefined };
    expect(licenceStanding(perpetual, GRACE)).toBe(LicenceStanding.Active);
  });

  it("throws a RangeError for a grace that is not a duration", () => {
    expect(() => licenceStanding(licence, "P-1D" as Duration, EXPIRY)).toThrow(RangeError);
  });
});
