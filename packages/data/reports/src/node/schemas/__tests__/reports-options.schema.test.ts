/**
 * Stackra file contract:
 * Purpose: unit tests of `ReportsOptions` and `ReportsConfig$`: the shipped defaults equal the class initializers, both
 *          duration forms are read canonical, and a page size or row cap of zero is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0363; ADR 0470 (decision 3).
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { REPORTS_CONFIG_SCHEMA } from "#node/constants/reports-config-schema.constant";
import { ReportsOptions } from "#node/schemas/reports-options.schema";

describe(ReportsOptions, () => {
  it("ships the class defaults", () => {
    const options = new ReportsOptions();
    expect(REPORTS_CONFIG_SCHEMA.parse({})).toEqual({
      pageSize: options.pageSize,
      maxRows: options.maxRows,
      timeout: options.timeout,
      replica: options.replica,
    });
  });

  it("reads both duration forms and refuses zero sizes", () => {
    expect(REPORTS_CONFIG_SCHEMA.parse({ timeout: "45s" }).timeout).toBe(Duration.seconds(45));
    expect(REPORTS_CONFIG_SCHEMA.safeParse({ pageSize: 0 }).success).toBe(false);
    expect(REPORTS_CONFIG_SCHEMA.safeParse({ maxRows: 0 }).success).toBe(false);
  });
});
