/**
 * Stackra file contract:
 * Purpose: unit tests of `parseSince`: a span counts back from now in seconds, minutes, hours or days; an ISO
 *          timestamp is taken as it is; anything else is a `CommandError` naming the forms.
 * Boundary: test only; pure function.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2889.
 */
import { CommandError } from "@stackra/console";
import { describe, expect, it } from "@stackra/testing";

import { parseSince } from "#node/functions/parse-since.function";

const now = new Date("2026-11-27T02:15:00.000Z");

describe("parseSince", () => {
  it("counts a span back from now", () => {
    expect(parseSince("90s", now).toISOString()).toBe("2026-11-27T02:13:30.000Z");
    expect(parseSince("15m", now).toISOString()).toBe("2026-11-27T02:00:00.000Z");
    expect(parseSince("2h", now).toISOString()).toBe("2026-11-27T00:15:00.000Z");
    expect(parseSince(" 1d ", now).toISOString()).toBe("2026-11-26T02:15:00.000Z");
  });

  it("takes an ISO timestamp", () => {
    expect(parseSince("2026-11-27T01:00:00Z", now).toISOString()).toBe("2026-11-27T01:00:00.000Z");
  });

  it("refuses anything else", () => {
    expect(() => parseSince("yesterday", now)).toThrow(CommandError);
    expect(() => parseSince("15", now)).toThrow(CommandError);
    expect(() => parseSince("1 week", now)).toThrow(CommandError);
  });
});
