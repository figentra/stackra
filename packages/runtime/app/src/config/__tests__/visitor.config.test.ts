/**
 * Stackra file contract:
 * Purpose: unit tests of `VisitorConfig`: its key, its defaults (no signing key, so no visitor identity), a host's
 *          override, a refused header name, and the shipped schema's defaults equal to the shape's initializers.
 * Boundary: test only; builds the configuration in process, no environment and no secret store.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26); STA-2025 (as amended 2026-11-09).
 */
import { buildConfig, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { VisitorConfig as BaseVisitorConfig } from "#config/visitor.config";
import { VISITOR_CONFIG_SCHEMA } from "#core/constants/visitor-config-schema.constant";
import { VisitorOptions } from "#core/schemas/visitor-options.schema";

/** A host's override: a month-long cookie. */
class VisitorConfig extends BaseVisitorConfig {
  override cookieMaxAgeDays = 30;
}

describe("VisitorConfig", () => {
  it("is keyed app.visitor", () => {
    expect(configKey(BaseVisitorConfig, "app")).toBe("app.visitor");
  });

  it("builds with its defaults: no signing key until the secret is set", () => {
    const config = buildConfig(BaseVisitorConfig);
    expect(config.signingKey).toBe("");
    expect(config.previousSigningKey).toBe("");
    expect(config.headerName).toBe("stackra-visitor");
    expect(config.cookieName).toBe("stackra_visitor");
    expect(config.cookieMaxAgeDays).toBe(365);
  });

  it("takes a host's override", () => {
    expect(buildConfig(VisitorConfig).cookieMaxAgeDays).toBe(30);
  });

  it("refuses a header name with upper case", () => {
    class BadVisitorConfig extends BaseVisitorConfig {
      override headerName = "Stackra-Visitor";
    }
    expect(() => buildConfig(BadVisitorConfig)).toThrow(ConfigInvalidError);
  });

  it("ships schema defaults equal to the shape's initializers", () => {
    expect(VISITOR_CONFIG_SCHEMA.parse({})).toEqual({ ...new VisitorOptions() });
  });
});
