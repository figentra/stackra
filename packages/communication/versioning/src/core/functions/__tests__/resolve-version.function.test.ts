/**
 * Stackra file contract:
 * Purpose: unit tests of `resolveVersion`: the header wins over the pin, the pin over the fallback; the newest version
 *          carries no header, an older one `Deprecation` (its successor's day) and `Sunset` (the earliest sunset after
 *          it, capped by the support window after its successor, which alone sunsets and retires a version that no
 *          change follows); a bad support window throws; an unknown or empty header and a stale pin are refused as unsupported, a version past its sunset as
 *          sunset, and a fallback outside `supported` throws; one supported date and no change is the dormant case.
 * Boundary: test only; registers dated changes the way gen does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0118 (decisions 1, 3 and 4 and the enforcement test of a sunset
 *                     version); RFC 9745; RFC 8594.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";
import { Schema } from "@stackra/validation";

import { Change } from "#core/bases/change.base";
import { UnsupportedVersionError } from "#core/errors/unsupported-version.error";
import { VersionSunsetError } from "#core/errors/version-sunset.error";
import { registerChanges } from "#core/functions/register-changes.function";
import { resolveVersion } from "#core/functions/resolve-version.function";

class OrderView extends Schema {
  id!: string;
}

class CustomerView extends Schema {
  id!: string;
}

registerChanges([
  [OrderView, Change<OrderView>({ from: "2027-03-01", sunset: "2028-03-01" })],
  [CustomerView, Change<CustomerView>({ from: "2027-09-01", sunset: "2028-09-01" })],
]);

const config = {
  supported: ["2026-10-01", "2027-03-01", "2027-09-01"],
  fallback: "2026-10-01",
  now: new Date("2027-10-15T12:00:00Z"),
};

/** The refusal `run` throws. */
function thrown(run: () => unknown): unknown {
  try {
    run();
  } catch (error) {
    return error;
  }
  throw new Error("expected a throw");
}

describe("resolveVersion", () => {
  it("takes the header over the pin and the pin over the fallback", () => {
    expect(resolveVersion({ ...config, header: "2027-09-01", pin: "2027-03-01" }).version).toBe(
      "2027-09-01",
    );
    expect(resolveVersion({ ...config, header: null, pin: "2027-03-01" }).version).toBe(
      "2027-03-01",
    );
    expect(resolveVersion(config).version).toBe("2026-10-01");
  });

  it("sends no header for the newest version", () => {
    expect(resolveVersion({ ...config, header: "2027-09-01" })).toEqual({
      version: "2027-09-01",
      headers: {},
    });
  });

  it("sends Deprecation and the earliest Sunset after an older version", () => {
    expect(resolveVersion(config)).toEqual({
      version: "2026-10-01",
      headers: { Deprecation: "@1803859200", Sunset: "Wed, 01 Mar 2028 00:00:00 GMT" },
    });
    expect(resolveVersion({ ...config, pin: "2027-03-01" }).headers).toEqual({
      Deprecation: "@1819756800",
      Sunset: "Fri, 01 Sep 2028 00:00:00 GMT",
    });
  });

  it("refuses a version the service does not serve", () => {
    for (const request of [
      { ...config, header: "2025-01-01" },
      { ...config, header: "" },
      { ...config, pin: "2026-04-01" },
    ]) {
      const error = thrown(() => resolveVersion(request));
      expect(isRefusal(error, UnsupportedVersionError)).toBe(true);
      expect((error as UnsupportedVersionError).details).toEqual({ supported: config.supported });
    }
  });

  it("refuses a version past its sunset", () => {
    const error = thrown(() =>
      resolveVersion({ ...config, now: new Date("2028-03-01T00:00:00Z") }),
    );
    expect(isRefusal(error, VersionSunsetError)).toBe(true);
    expect((error as VersionSunsetError).details).toEqual({
      version: "2026-10-01",
      sunset: "2028-03-01",
    });
    expect(resolveVersion({ ...config, now: new Date("2028-02-29T23:59:59Z") }).version).toBe(
      "2026-10-01",
    );
  });

  it("serves a version no change follows until its support window ends, then retires it", () => {
    const window = { supported: ["2026-10-01", "2027-01-31"], fallback: "2026-10-01" };
    expect(resolveVersion({ ...window, now: new Date("2027-06-01T00:00:00Z") })).toEqual({
      version: "2026-10-01",
      headers: { Deprecation: "@1801353600", Sunset: "Mon, 31 Jan 2028 00:00:00 GMT" },
    });
    // the window is configuration: 6 months from 31 January clamps to 31 July
    expect(
      resolveVersion({ ...window, supportMonths: 6, now: new Date("2027-06-01T00:00:00Z") })
        .headers,
    ).toEqual({ Deprecation: "@1801353600", Sunset: "Sat, 31 Jul 2027 00:00:00 GMT" });
    const error = thrown(() =>
      resolveVersion({ ...window, supportMonths: 6, now: new Date("2027-07-31T00:00:00Z") }),
    );
    expect(isRefusal(error, VersionSunsetError)).toBe(true);
    expect((error as VersionSunsetError).details).toEqual({
      version: "2026-10-01",
      sunset: "2027-07-31",
    });
  });

  it("takes the window when it ends before a change's sunset", () => {
    const june = new Date("2027-06-01T00:00:00Z");
    expect(resolveVersion({ ...config, supportMonths: 6, now: june }).headers).toEqual({
      Deprecation: "@1803859200",
      Sunset: "Wed, 01 Sep 2027 00:00:00 GMT",
    });
  });

  it("throws on a support window that is not a whole number of months above 0", () => {
    for (const supportMonths of [0, -1, 1.5, Number.NaN])
      expect(() => resolveVersion({ ...config, supportMonths })).toThrow(TypeError);
  });

  it("throws when the fallback is not supported", () => {
    expect(() => resolveVersion({ ...config, fallback: "2026-01-01" })).toThrow(TypeError);
  });

  it("is dormant with one supported date", () => {
    expect(
      resolveVersion({ supported: ["2026-10-01"], fallback: "2026-10-01", now: config.now }),
    ).toEqual({ version: "2026-10-01", headers: {} });
  });
});
