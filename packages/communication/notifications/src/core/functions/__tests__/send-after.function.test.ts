/**
 * Stackra file contract:
 * Purpose: unit tests of `sendAfter`: outside quiet hours and for a mandatory category a notification goes now; inside a
 *          window over midnight it waits for the window's local end; a malformed time is refused.
 * Boundary: test only. The window and the mandatory list are test data, the way settings carry them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; OS-195, OS-196.
 */
import { describe, expect, it } from "@stackra/testing";

import { sendAfter } from "#core/functions/send-after.function";

const quietHours = { start: "22:00", end: "07:00", timeZone: "Asia/Riyadh" };
const at = (iso: string) => new Date(iso);

describe("sendAfter", () => {
  it("sends now outside the window", () => {
    const now = at("2026-10-25T09:00:00Z"); // 12:00 in Riyadh
    expect(sendAfter({ category: "marketing", mandatory: [], quietHours, now })).toEqual(now);
  });

  it("waits for the local end of a window over midnight", () => {
    const now = at("2026-10-25T20:30:15Z"); // 23:30:15 in Riyadh
    expect(
      sendAfter({ category: "marketing", mandatory: ["security"], quietHours, now }).toISOString(),
    ).toBe("2026-10-26T04:00:00.000Z");
  });

  it("lets a mandatory category through and needs no window", () => {
    const now = at("2026-10-25T20:30:00Z");
    expect(sendAfter({ category: "security", mandatory: ["security"], quietHours, now })).toEqual(
      now,
    );
    expect(sendAfter({ category: "marketing", mandatory: [], now })).toEqual(now);
  });

  it("refuses a malformed window", () => {
    expect(() =>
      sendAfter({
        category: "x",
        mandatory: [],
        quietHours: { ...quietHours, start: "25:00" },
        now: at("2026-10-25T00:00:00Z"),
      }),
    ).toThrow(RangeError);
  });
});
