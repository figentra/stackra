/**
 * Stackra file contract:
 * Purpose: unit tests of `localeFormat`: a locale's week start and clock from its case data, and a configured override
 *          replacing either part alone.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0403.
 */
import { describe, expect, it } from "@stackra/testing";

import { HourCycle } from "#core/enums/hour-cycle.enum";
import { Locale } from "#core/enums/locale.enum";
import { localeFormat } from "#core/functions/locale-format.function";

describe("localeFormat", () => {
  it("gives the locale's defaults", () => {
    expect(localeFormat(Locale.It)).toEqual({ weekStart: 1, hourCycle: HourCycle.H23 });
    expect(localeFormat(Locale.EnUs)).toEqual({ weekStart: 7, hourCycle: HourCycle.H12 });
  });

  it("lets the configured override replace each part", () => {
    expect(localeFormat(Locale.En, { hourCycle: HourCycle.H23 })).toEqual({
      weekStart: 1,
      hourCycle: HourCycle.H23,
    });
    expect(localeFormat(Locale.ArSa, { weekStart: 6 })).toEqual({
      weekStart: 6,
      hourCycle: HourCycle.H12,
    });
  });
});
