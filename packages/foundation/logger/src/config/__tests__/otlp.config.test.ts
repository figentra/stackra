/**
 * Stackra file contract:
 * Purpose: unit tests of `OtlpConfig`, `OtlpOptions` and `OTLP_CONFIG_SCHEMA`: keyed `logger.otlp`, built with the
 *          shipped defaults, registered with its schema, and refusing a non-URL endpoint, a bad secret name, a zero
 *          batch, a sample ratio above 1 or a sub-second metric interval.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 19, 20 and 26).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { OtlpConfig } from "#config/otlp.config";
import { OTLP_CONFIG_SCHEMA } from "#core/constants/otlp-config-schema.constant";
import { OtlpOptions } from "#core/schemas/otlp-options.schema";

describe("OtlpConfig", () => {
  it("is a configuration keyed logger.otlp", () => {
    expect(new OtlpConfig()).toBeInstanceOf(Config);
    expect(configKey(OtlpConfig, "logger")).toBe("logger.otlp");
  });

  it("builds with the shipped defaults, which equal the shape's initializers", () => {
    expect(schemaOf(OtlpOptions)).toBe(OTLP_CONFIG_SCHEMA);
    expect({ ...new OtlpOptions() }).toEqual(OTLP_CONFIG_SCHEMA.parse({}));
    expect({ ...buildConfig(OtlpConfig) }).toEqual(OTLP_CONFIG_SCHEMA.parse({}));
  });

  it("refuses bad values", () => {
    for (const values of [
      { endpoint: "nope" },
      { headersSecret: "lower" },
      { batchSize: 0 },
      { traceSampleRatio: 1.5 },
      { metricIntervalMs: 10 },
    ])
      expect(() => buildConfig(OtlpConfig, { values })).toThrow(ConfigInvalidError);
  });
});
