/**
 * Stackra file contract:
 * Purpose: unit tests of `HourCycle`: the Intl `hc` codes `h12` and `h23`, which Intl applies as the `-u-hc-`
 *          extension.
 * Boundary: test only.
 * Runtime: node (vitest, full ICU)
 * Governing contract: ADR 0022; ADR 0269; ADR 0403.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { HourCycle } from "#core/enums/hour-cycle.enum";

describe("HourCycle", () => {
  it("holds the twelve- and twenty-four-hour clocks", () => {
    expect(Enum.values(HourCycle)).toEqual(["h12", "h23"]);
  });

  it("uses the codes Intl reads as the hc extension", () => {
    const at = new Date("2026-10-24T15:30:00Z");
    const time = (tag: string) =>
      new Intl.DateTimeFormat(tag, { timeStyle: "short", timeZone: "UTC" }).format(at);
    expect(time(`en-u-hc-${HourCycle.H23}`)).toBe("15:30");
    expect(time(`de-u-hc-${HourCycle.H12}`)).toMatch(/3:30/);
  });
});
