/**
 * Stackra file contract:
 * Purpose: proves `uptimeShareOf` (up and degraded count as up, no data is left out) and `changeOf` (the change from
 *          the previous period as a fraction, none against zero or text).
 * Boundary: pure functions; no rendering.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); ADR 0307 (decision 15); STA-1371.
 */
import type { TrackerCell } from "#contracts/types/tracker-cell.type";
import { changeOf } from "#core/functions/change-of.function";
import { uptimeShareOf } from "#core/functions/uptime-share-of.function";

/** A cell in `status`. */
const cell = (key: string, status: TrackerCell["status"]): TrackerCell => ({
  key,
  label: key,
  status,
});

describe("uptimeShareOf", () => {
  it("counts up and degraded as up and leaves periods with no data out", () => {
    expect(
      uptimeShareOf([cell("a", "up"), cell("b", "degraded"), cell("c", "down"), cell("d", "none")]),
    ).toBeCloseTo(2 / 3);
  });

  it("is null when no period has data", () => {
    expect(uptimeShareOf([])).toBeNull();
    expect(uptimeShareOf([cell("a", "none")])).toBeNull();
  });
});

describe("changeOf", () => {
  it("is the fractional change from the previous period", () => {
    expect(changeOf(112, 100)).toBeCloseTo(0.12);
    expect(changeOf(80, 100)).toBeCloseTo(-0.2);
    expect(changeOf(-50, -100)).toBeCloseTo(0.5);
  });

  it("has nothing to say against zero, a missing figure or text", () => {
    expect(changeOf(10, 0)).toBeUndefined();
    expect(changeOf(10, undefined)).toBeUndefined();
    expect(changeOf("10", 5)).toBeUndefined();
  });
});
