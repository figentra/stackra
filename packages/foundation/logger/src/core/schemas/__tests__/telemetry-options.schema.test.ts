/**
 * Stackra file contract:
 * Purpose: unit and type tests of `TelemetryOptions` and its shipped schema: the class's initializers equal the
 *          schema's dev-safe defaults (nothing reported, ADR 0183 budgets, no Lighthouse path), the schema's output is
 *          exactly the class's fields, the schema is registered for the class, every nested default parses on its
 *          own, a partial nested value fills its own defaults, a leftover DSN or error sampling is dropped (ADR 0465),
 *          and out-of-range values are refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26);
 *                     ADR 0183.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";
import type { Assert, Fields, Same } from "@stackra/validation";
import type { z } from "zod";

import { TELEMETRY_CONFIG_SCHEMA } from "#core/constants/telemetry-config-schema.constant";
import { TelemetryOptions } from "#core/schemas/telemetry-options.schema";

/** The check gen writes for a shape and its schema. */
type TelemetryOptions$Check = Assert<
  Same<z.output<typeof TELEMETRY_CONFIG_SCHEMA>, Fields<TelemetryOptions>>
>;

describe("TelemetryOptions", () => {
  it("has the schema's dev-safe defaults as its initializers", () => {
    expect({ ...new TelemetryOptions() }).toEqual(TELEMETRY_CONFIG_SCHEMA.parse({}));
    expect(TELEMETRY_CONFIG_SCHEMA.parse({})).toEqual({
      errors: { enabled: false, nativeCrashes: false },
      traces: { sampleRate: 0 },
      replay: { onErrorSampleRate: 0, consent: null },
      vitals: { enabled: false },
      budgets: { lcpMs: 2500, inpMs: 200, cls: 0.1, entryKb: 200, routeKb: 100, coldStartMs: 2000 },
      lighthouse: { paths: [], runs: 3, minScores: { performance: 0.9, accessibility: 1, seo: 1 } },
    });
  });

  it("matches its schema's output type exactly", () => {
    expectTypeOf<TelemetryOptions$Check>().toEqualTypeOf<true>();
  });

  it("registers its schema for itself", () => {
    expect(schemaOf(TelemetryOptions)).toBe(TELEMETRY_CONFIG_SCHEMA);
  });

  it("gives each nested default alone", () => {
    const defaults = TELEMETRY_CONFIG_SCHEMA.parse({});
    const { shape } = TELEMETRY_CONFIG_SCHEMA;
    expect(shape.errors.parse(undefined)).toEqual(defaults.errors);
    expect(shape.traces.parse(undefined)).toEqual(defaults.traces);
    expect(shape.replay.parse(undefined)).toEqual(defaults.replay);
    expect(shape.vitals.parse(undefined)).toEqual(defaults.vitals);
    expect(shape.budgets.parse(undefined)).toEqual(defaults.budgets);
    expect(shape.lighthouse.parse(undefined)).toEqual(defaults.lighthouse);
  });

  it("fills a partial nested value, as a runway layer sets one", () => {
    expect(TELEMETRY_CONFIG_SCHEMA.parse({ traces: { sampleRate: 0.5 } }).traces).toEqual({
      sampleRate: 0.5,
    });
    expect(TELEMETRY_CONFIG_SCHEMA.parse({ errors: { enabled: true } }).errors).toEqual({
      enabled: true,
      nativeCrashes: false,
    });
  });

  it("drops a leftover DSN or error sampling: both are SentryConfig's (ADR 0465)", () => {
    const parsed = TELEMETRY_CONFIG_SCHEMA.parse({
      dsn: "https://key@o1.ingest.example/1",
      errors: { sampleRate: 0.5 },
    });
    expect(parsed).not.toHaveProperty("dsn");
    expect(parsed.errors).not.toHaveProperty("sampleRate");
  });

  it("refuses out-of-range values", () => {
    expect(TELEMETRY_CONFIG_SCHEMA.safeParse({ traces: { sampleRate: 2 } }).success).toBe(false);
    expect(TELEMETRY_CONFIG_SCHEMA.safeParse({ budgets: { lcpMs: -1 } }).success).toBe(false);
    expect(TELEMETRY_CONFIG_SCHEMA.safeParse({ lighthouse: { runs: 0 } }).success).toBe(false);
    expect(TELEMETRY_CONFIG_SCHEMA.safeParse({ lighthouse: { paths: ["pricing"] } }).success).toBe(
      false,
    );
  });
});
