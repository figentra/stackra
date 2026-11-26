/**
 * Stackra file contract:
 * Purpose: unit and type tests of `LoggingConfig`: a configuration over `LoggingOptions` keyed `logger.logging`, built
 *          with its defaults, the template's commerce override (extra redacted fields merged over the base value) and
 *          a runway values layer, and the generated host schema's `Base$.extend(...)` form over `LoggingConfig$`.
 * Boundary: test only; the override is the template's `services/commerce/src/config/logging.config.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 19,
 *                     20 and 26).
 */
import { readFileSync } from "node:fs";

import { buildConfig, Config, configKey } from "@stackra/config";
import { Module } from "@stackra/container";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { LoggingConfig } from "#config/logging.config";
import { LOGGING_CONFIG_SCHEMA } from "#core/constants/logging-config-schema.constant";
import { ConsoleLogReporterDriver } from "#core/drivers/console-log-reporter.driver";
import { OtlpLogReporterDriver } from "#core/drivers/otlp-log-reporter.driver";
import type { LogLevel } from "#contracts/enums/log-level.enum";
import { LogReporter } from "#contracts/ports/log-reporter.port";

/** The template's override, under the plain name with the package class aliased. */
const BaseLoggingConfig = LoggingConfig;

/** A base instance whose nested values an override spreads (tsc refuses `this.<field>` in its own initializer). */
const BASE = new BaseLoggingConfig();

class CommerceLoggingConfig extends BaseLoggingConfig {
  override redaction: LoggingConfig["redaction"] = {
    ...BASE.redaction,
    extraFields: ["customerId", "paymentId"],
  };
}

describe("LoggingConfig", () => {
  it("is a configuration keyed logger.logging, an override inheriting the key", () => {
    expect(new LoggingConfig()).toBeInstanceOf(Config);
    expect(configKey(LoggingConfig, "logger")).toBe("logger.logging");
    expect(configKey(CommerceLoggingConfig, "logger")).toBe("logger.logging");
  });

  it("types its fields on the class and builds with the defaults", () => {
    const config = buildConfig(LoggingConfig);
    expectTypeOf(config.level).toEqualTypeOf<LogLevel>();
    expectTypeOf(config.redaction.extraFields).toEqualTypeOf<string[]>();
    expect({ ...config }).toEqual(LOGGING_CONFIG_SCHEMA.parse({}));
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("applies the template's override over the base value", () => {
    expect(buildConfig(CommerceLoggingConfig).redaction).toEqual({
      extraFields: ["customerId", "paymentId"],
    });
  });

  it("takes a runway values layer", () => {
    const config = buildConfig(LoggingConfig, {
      values: { level: "warn", channels: { orders: "debug" }, sampleRate: 0.25 },
    });
    expect(config).toMatchObject({
      level: "warn",
      channels: { orders: "debug" },
      sampleRate: 0.25,
    });
  });

  it("selects the LogReporter driver, so the committed manifest names it as the selector", () => {
    const manifest = JSON.parse(
      readFileSync(new URL("../../../stackra.manifest.json", import.meta.url), "utf8"),
    ) as { drivers: { port: string; selectedBy?: string; config?: { class: string } }[] };
    expect(manifest.drivers.find((driver) => driver.port === "LogReporter")).toMatchObject({
      selectedBy: "config:logger.logging.reporter",
      config: { class: "LoggingConfig" },
    });
  });

  it("boots a member that injects LogReporter with no logging config, on the console reporter", async () => {
    class LoggerModule extends Module({}) {}
    registerWiring({
      member: "logger",
      root: LoggerModule,
      modules: { logger: { exports: [], dependsOn: [] } },
      bindings: [],
      config: [{ key: "logger.logging", provide: LoggingConfig }],
      drivers: [
        {
          port: LogReporter,
          key: "logger.LogReporter",
          selectedBy: "config:logger.logging.reporter",
          candidates: {
            console: () => Promise.resolve(ConsoleLogReporterDriver),
            otlp: () => Promise.resolve(OtlpLogReporterDriver),
          },
        },
      ],
    });
    const app = await createTestingModule(LoggerModule).compile();
    expect(app.get(LogReporter)).toBeInstanceOf(ConsoleLogReporterDriver);
  });

  it("is extended by a host's generated schema", () => {
    const Host$ = LOGGING_CONFIG_SCHEMA.extend({
      redaction: LOGGING_CONFIG_SCHEMA.shape.redaction.unwrap().default(() => ({
        ...LOGGING_CONFIG_SCHEMA.shape.redaction.parse(undefined),
        extraFields: ["customerId", "paymentId"],
      })),
    });
    expect(Host$.parse({})).toEqual({ ...buildConfig(CommerceLoggingConfig) });
  });
});
