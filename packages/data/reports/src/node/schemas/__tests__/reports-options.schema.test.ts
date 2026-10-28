/**
 * Stackra file contract:
 * Purpose: unit tests of `ReportsOptions` and `ReportsConfig$`: the shipped defaults equal the class initializers, both
 *          duration forms are read canonical, a page size or row cap of zero is refused, and the engine takes only a
 *          shipped `ReportEngine` driver name.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0363; ADR 0470 (decision 3).
 */
import { Duration } from "@stackra/contracts";
import type { DriverName } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { ReportEngine } from "#contracts/ports/report-engine.port";

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
      engine: options.engine,
    });
  });

  it("reads both duration forms and refuses zero sizes", () => {
    expect(REPORTS_CONFIG_SCHEMA.parse({ timeout: "45s" }).timeout).toBe(Duration.seconds(45));
    expect(REPORTS_CONFIG_SCHEMA.safeParse({ pageSize: 0 }).success).toBe(false);
    expect(REPORTS_CONFIG_SCHEMA.safeParse({ maxRows: 0 }).success).toBe(false);
  });

  it("selects a shipped engine only", () => {
    expect(new ReportsOptions().engine).toBe("postgres");
    expect(REPORTS_CONFIG_SCHEMA.safeParse({ engine: "clickhouse" }).success).toBe(false);
    expectTypeOf<DriverName<ReportEngine>>().toEqualTypeOf<"postgres">();
  });
});
