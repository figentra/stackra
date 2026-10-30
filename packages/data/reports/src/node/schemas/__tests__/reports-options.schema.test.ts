/**
 * Stackra file contract:
 * Purpose: unit tests of `ReportsOptions` and `ReportsConfig$`: the shipped defaults equal the class initializers, both
 *          duration forms are read canonical, a page size or row cap of zero is refused, the engine and the product
 *          analytics driver take only shipped driver names, and the PostHog settings refuse a malformed project id,
 *          secret name or scope property.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0363; ADR 0470 (decision 3).
 */
import { Duration } from "@stackra/contracts";
import type { DriverName } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { Forecaster } from "#contracts/ports/forecaster.port";
import type { ProductAnalytics } from "#contracts/ports/product-analytics.port";
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
      productAnalytics: options.productAnalytics,
      forecaster: options.forecaster,
      forecast: options.forecast,
      posthog: options.posthog,
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

  it("selects a shipped forecaster driver and checks the forecast settings", () => {
    expect(new ReportsOptions().forecaster).toBe("http");
    expectTypeOf<DriverName<Forecaster>>().toEqualTypeOf<"http" | "memory">();
    expect(REPORTS_CONFIG_SCHEMA.safeParse({ forecaster: "prophet" }).success).toBe(false);
    expect(REPORTS_CONFIG_SCHEMA.parse({}).forecast).toEqual({ baseUrl: null, tokenSecret: null });
    const forecast = {
      baseUrl: "http://forecast.gcc.tools.acme.internal:8080",
      tokenSecret: "FORECAST_TOKEN",
    };
    expect(REPORTS_CONFIG_SCHEMA.parse({ forecast }).forecast).toEqual(forecast);
    expect(REPORTS_CONFIG_SCHEMA.safeParse({ forecast: { baseUrl: "no url" } }).success).toBe(
      false,
    );
    expect(REPORTS_CONFIG_SCHEMA.safeParse({ forecast: { tokenSecret: "lower" } }).success).toBe(
      false,
    );
  });

  it("selects a shipped product analytics driver and checks the PostHog settings", () => {
    expect(new ReportsOptions().productAnalytics).toBe("posthog");
    expectTypeOf<DriverName<ProductAnalytics>>().toEqualTypeOf<"posthog">();
    expect(REPORTS_CONFIG_SCHEMA.safeParse({ productAnalytics: "mixpanel" }).success).toBe(false);
    const posthog = {
      host: "https://eu.posthog.com",
      projectId: "12345",
      keySecret: "REPORTS_POSTHOG_KEY",
    };
    expect(REPORTS_CONFIG_SCHEMA.parse({ posthog }).posthog).toEqual({
      ...posthog,
      scopeProperty: "scope_id",
    });
    expect(REPORTS_CONFIG_SCHEMA.safeParse({ posthog: { projectId: "abc" } }).success).toBe(false);
    expect(REPORTS_CONFIG_SCHEMA.safeParse({ posthog: { keySecret: "phx_value" } }).success).toBe(
      false,
    );
    expect(REPORTS_CONFIG_SCHEMA.safeParse({ posthog: { scopeProperty: "a b" } }).success).toBe(
      false,
    );
  });
});
