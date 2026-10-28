/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: exactly its values are exported.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/reports/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual([
      "PostgresReportRunnerDriver",
      "ReportRequestInvalidError",
      "ReportsConfig",
      "ReportsConfig$",
      "ReportsOptions",
      "registerReportSources",
    ]);
  });
});
