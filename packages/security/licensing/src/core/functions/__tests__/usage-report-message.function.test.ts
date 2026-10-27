/**
 * Stackra file contract:
 * Purpose: unit tests of `usageReportMessage`: the UTF-8 of the canonical JSON of the payload, keys sorted at every
 *          depth, so the same payload in any key order gives the same bytes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0416.
 */
import { describe, expect, it } from "@stackra/testing";

import { usageReportMessage } from "#core/functions/usage-report-message.function";

describe("usageReportMessage", () => {
  it("writes the canonical JSON of the payload", () => {
    const bytes = usageReportMessage({
      version: 1,
      licenceId: "lic-1",
      periodStart: "2027-01-01T00:00:00.000Z",
      periodEnd: "2027-04-01T00:00:00.000Z",
      lines: { seats: 12, api_calls: 3 },
    });
    expect(new TextDecoder().decode(bytes)).toBe(
      '{"licenceId":"lic-1","lines":{"api_calls":3,"seats":12},"periodEnd":"2027-04-01T00:00:00.000Z",' +
        '"periodStart":"2027-01-01T00:00:00.000Z","version":1}',
    );
  });
});
