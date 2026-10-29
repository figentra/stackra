/**
 * Stackra file contract:
 * Purpose: unit tests of `BearerConfig`: keyed `app.bearer`, built with its defaults (no issuer, no audience, 60-second
 *          leeway, one-hour key cache), the issuer and audience from the environment, a host override, and refusing
 *          an issuer that is not a URL or a leeway above five minutes; the shipped schema's defaults equal
 *          `BearerOptions`' initializers.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 19, 20 and 26); ADR 0206 (decision 8).
 */
import { buildConfig, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { BearerConfig as BaseBearerConfig } from "#config/bearer.config";
import { BEARER_CONFIG_SCHEMA } from "#core/constants/bearer-config-schema.constant";
import { BearerOptions } from "#core/schemas/bearer-options.schema";

/** A host's override: a tighter leeway. */
class BearerConfig extends BaseBearerConfig {
  override leewaySeconds = 30;
}

describe("BearerConfig", () => {
  it("is keyed app.bearer", () => {
    expect(configKey(BaseBearerConfig, "app")).toBe("app.bearer");
  });

  it("builds with its defaults", () => {
    const config = buildConfig(BaseBearerConfig);
    expect(config.issuer).toBe("");
    expect(config.audience).toBe("");
    expect(config.leewaySeconds).toBe(60);
    expect(config.keysSeconds).toBe(3600);
  });

  it("reads the issuer and audience from the environment", () => {
    const config = buildConfig(BaseBearerConfig, {
      env: {
        STACKRA_BEARER_ISSUER: "https://auth.figentra.com",
        STACKRA_BEARER_AUDIENCE: "project-1",
      },
    });
    expect(config.issuer).toBe("https://auth.figentra.com");
    expect(config.audience).toBe("project-1");
  });

  it("takes a host's override", () => {
    expect(buildConfig(BearerConfig).leewaySeconds).toBe(30);
  });

  it("refuses an issuer that is not a URL", () => {
    expect(() => buildConfig(BaseBearerConfig, { env: { STACKRA_BEARER_ISSUER: "auth" } })).toThrow(
      ConfigInvalidError,
    );
  });

  it("refuses a leeway above five minutes", () => {
    class BadBearerConfig extends BaseBearerConfig {
      override leewaySeconds = 301;
    }
    expect(() => buildConfig(BadBearerConfig)).toThrow(ConfigInvalidError);
  });

  it("ships schema defaults equal to the shape's initializers", () => {
    expect(BEARER_CONFIG_SCHEMA.parse({})).toEqual({ ...new BearerOptions() });
  });
});
