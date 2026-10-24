/**
 * Stackra file contract:
 * Purpose: unit tests of `TelemetryConfig`: a configuration over `TelemetryOptions` keyed `logger.telemetry`, built
 *          with its dev-safe defaults, the template's mobile, console and web overrides (each nested object merged
 *          over the base value) and a runway values layer, and the generated host schema's `Base$.extend(...)` form
 *          over `TelemetryConfig$`.
 * Boundary: test only; the overrides restate the template's `apps/{mobile,console,web}/src/config/telemetry.config.ts`
 *           with the consent code as its string (`crash_replay`), since consent sits above this package.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 19,
 *                     20 and 26); ADR 0183; ADR 0184.
 */
import { buildConfig, Config, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { TelemetryConfig } from "#config/telemetry.config";
import { TELEMETRY_CONFIG_SCHEMA } from "#core/constants/telemetry-config-schema.constant";

const BaseTelemetryConfig = TelemetryConfig;

/** A base instance whose nested values an override spreads (tsc refuses `this.<field>` in its own initializer). */
const BASE = new BaseTelemetryConfig();

class MobileTelemetryConfig extends BaseTelemetryConfig {
  override errors: TelemetryConfig["errors"] = {
    ...BASE.errors,
    enabled: true,
    sampleRate: 1,
    nativeCrashes: true,
  };

  override traces: TelemetryConfig["traces"] = { ...BASE.traces, sampleRate: 0.1 };

  override replay: TelemetryConfig["replay"] = {
    ...BASE.replay,
    onErrorSampleRate: 1,
    consent: "crash_replay",
  };

  override budgets: TelemetryConfig["budgets"] = { ...BASE.budgets, coldStartMs: 1500 };
}

class WebTelemetryConfig extends BaseTelemetryConfig {
  override errors: TelemetryConfig["errors"] = { ...BASE.errors, enabled: true, sampleRate: 1 };

  override replay: TelemetryConfig["replay"] = { ...BASE.replay, onErrorSampleRate: 0 };

  override vitals: TelemetryConfig["vitals"] = { ...BASE.vitals, enabled: true };

  override lighthouse: TelemetryConfig["lighthouse"] = {
    ...BASE.lighthouse,
    paths: ["/", "/pricing", "/store", "/store/demo-tee"],
    runs: 3,
    minScores: { performance: 0.9, accessibility: 1, seo: 1 },
  };
}

describe("TelemetryConfig", () => {
  it("is a configuration keyed logger.telemetry, an override inheriting the key", () => {
    expect(new TelemetryConfig()).toBeInstanceOf(Config);
    expect(configKey(TelemetryConfig, "logger")).toBe("logger.telemetry");
    expect(configKey(MobileTelemetryConfig, "logger")).toBe("logger.telemetry");
  });

  it("builds with the dev-safe defaults", () => {
    const config = buildConfig(TelemetryConfig);
    expect({ ...config }).toEqual(TELEMETRY_CONFIG_SCHEMA.parse({}));
    expect(config.errors.enabled).toBe(false);
    expect(config.dsn).toBeNull();
  });

  it("applies the mobile override, keeping the base's other nested values", () => {
    const config = buildConfig(MobileTelemetryConfig);
    expect(config.errors).toEqual({ enabled: true, sampleRate: 1, nativeCrashes: true });
    expect(config.replay).toEqual({ onErrorSampleRate: 1, consent: "crash_replay" });
    expect(config.budgets).toMatchObject({ coldStartMs: 1500, lcpMs: 2500 });
    expect(config.vitals).toEqual({ enabled: false });
  });

  it("applies the web override with its Lighthouse paths", () => {
    const config = buildConfig(WebTelemetryConfig);
    expect(config.vitals.enabled).toBe(true);
    expect(config.lighthouse.paths).toEqual(["/", "/pricing", "/store", "/store/demo-tee"]);
    expect(config.errors.nativeCrashes).toBe(false);
  });

  it("takes a runway values layer that replaces a nested object whole", () => {
    const config = buildConfig(MobileTelemetryConfig, { values: { traces: { sampleRate: 0.5 } } });
    expect(config.traces).toEqual({ sampleRate: 0.5 });
    expect(config.errors.nativeCrashes).toBe(true);
  });

  it("is extended by a host's generated schema", () => {
    const { shape } = TELEMETRY_CONFIG_SCHEMA;
    const Host$ = TELEMETRY_CONFIG_SCHEMA.extend({
      errors: shape.errors.unwrap().default(() => ({
        ...shape.errors.parse(undefined),
        enabled: true,
        sampleRate: 1,
        nativeCrashes: true,
      })),
      traces: shape.traces.unwrap().default(() => ({
        ...shape.traces.parse(undefined),
        sampleRate: 0.1,
      })),
      replay: shape.replay.unwrap().default(() => ({
        ...shape.replay.parse(undefined),
        onErrorSampleRate: 1,
        consent: "crash_replay",
      })),
      budgets: shape.budgets.unwrap().default(() => ({
        ...shape.budgets.parse(undefined),
        coldStartMs: 1500,
      })),
    });
    expect(Host$.parse({})).toEqual({ ...buildConfig(MobileTelemetryConfig) });
  });
});
