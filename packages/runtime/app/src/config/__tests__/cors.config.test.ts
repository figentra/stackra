/**
 * Stackra file contract:
 * Purpose: unit tests of `CorsConfig`: keyed `app.cors`, built with its defaults (no origin, the usual methods, the
 *          CSRF header allowed, credentials on, 600-second preflight cache), origins from `STACKRA_CORS_ALLOWED_ORIGINS`,
 *          a host override, and refusing an origin with a path or a max-age out of range; the shipped schema's
 *          defaults equal `CorsOptions`' initializers.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 19, 20 and 26); ADR 0437.
 */
import { buildConfig, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { CorsConfig as BaseCorsConfig } from "#config/cors.config";
import { CORS_CONFIG_SCHEMA } from "#core/constants/cors-config-schema.constant";
import { CorsOptions } from "#core/schemas/cors-options.schema";

/** A host's override: one app origin, a one-hour preflight cache. */
class CorsConfig extends BaseCorsConfig {
  override allowedOrigins = ["https://app.acme.example"];

  override maxAgeSeconds = 3600;
}

describe("CorsConfig", () => {
  it("is keyed app.cors", () => {
    expect(configKey(BaseCorsConfig, "app")).toBe("app.cors");
  });

  it("builds with its defaults", () => {
    const config = buildConfig(BaseCorsConfig);
    expect(config.allowedOrigins).toEqual([]);
    expect(config.allowedMethods).toEqual(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"]);
    expect(config.allowedHeaders).toEqual(["content-type", "authorization", "x-stackra-csrf"]);
    expect(config.allowCredentials).toBe(true);
    expect(config.maxAgeSeconds).toBe(600);
  });

  it("reads the origins from the environment as a JSON array", () => {
    const config = buildConfig(BaseCorsConfig, {
      env: {
        STACKRA_CORS_ALLOWED_ORIGINS: '["https://app.acme.example","https://pos.acme.example"]',
      },
    });
    expect(config.allowedOrigins).toEqual(["https://app.acme.example", "https://pos.acme.example"]);
  });

  it("takes a host's override", () => {
    const config = buildConfig(CorsConfig);
    expect(config.allowedOrigins).toEqual(["https://app.acme.example"]);
    expect(config.maxAgeSeconds).toBe(3600);
  });

  it("refuses an origin with a path", () => {
    class BadCorsConfig extends BaseCorsConfig {
      override allowedOrigins = ["https://app.acme.example/x"];
    }
    expect(() => buildConfig(BadCorsConfig)).toThrow(ConfigInvalidError);
  });

  it("refuses a max-age above a day", () => {
    class BadCorsConfig extends BaseCorsConfig {
      override maxAgeSeconds = 86_401;
    }
    expect(() => buildConfig(BadCorsConfig)).toThrow(ConfigInvalidError);
  });

  it("ships schema defaults equal to the shape's initializers", () => {
    expect(CORS_CONFIG_SCHEMA.parse({})).toEqual({ ...new CorsOptions() });
  });
});
