/**
 * Stackra file contract:
 * Purpose: unit tests of `EdgeConfig`: keyed `app.edge`, built with its defaults (memory keys and nonces, no secret), a
 *          host override naming the `env` keys driver, and refusing a driver name the package does not ship; the
 *          shipped schema's defaults equal `EdgeOptions`' initializers.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 19, 20 and 26); ADR 0437.
 */
import { buildConfig, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { EdgeConfig as BaseEdgeConfig } from "#config/edge.config";
import { EDGE_CONFIG_SCHEMA } from "#core/constants/edge-config-schema.constant";
import { EdgeOptions } from "#core/schemas/edge-options.schema";

describe("EdgeConfig", () => {
  it("is keyed app.edge", () => {
    expect(configKey(BaseEdgeConfig, "app")).toBe("app.edge");
  });

  it("builds with its defaults", () => {
    const config = buildConfig(BaseEdgeConfig);
    expect(config.keys).toBe("memory");
    expect(config.nonces).toBe("memory");
    expect(config.signingKeys).toBe("");
  });

  it("takes a host's override", () => {
    class EdgeConfig extends BaseEdgeConfig {
      override keys = "env" as const;
    }
    expect(buildConfig(EdgeConfig).keys).toBe("env");
  });

  it("refuses a driver name the package does not ship", () => {
    expect(EDGE_CONFIG_SCHEMA.safeParse({ nonces: "valkey" }).success).toBe(false);
    expect(EDGE_CONFIG_SCHEMA.safeParse({ keys: "vault" }).success).toBe(false);
  });

  it("ships schema defaults equal to the shape's initializers", () => {
    expect(EDGE_CONFIG_SCHEMA.parse({})).toEqual({ ...new EdgeOptions() });
  });
});
