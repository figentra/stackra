/**
 * Stackra file contract:
 * Purpose: unit tests of `CsrfConfig`: keyed `app.csrf`, built with its defaults (POST, PUT, PATCH and DELETE
 *          protected, header `x-stackra-csrf`, custom-header mode), a host override turning on double-submit, and
 *          refusing a header name with upper case; the shipped schema's defaults equal `CsrfOptions`' initializers.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 19, 20 and 26); ADR 0437.
 */
import { buildConfig, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { CsrfConfig as BaseCsrfConfig } from "#config/csrf.config";
import { CSRF_CONFIG_SCHEMA } from "#core/constants/csrf-config-schema.constant";
import { CsrfOptions } from "#core/schemas/csrf-options.schema";

/** A host's override: double-submit. */
class CsrfConfig extends BaseCsrfConfig {
  override tokenCookie = "__Host-csrf";
}

describe("CsrfConfig", () => {
  it("is keyed app.csrf", () => {
    expect(configKey(BaseCsrfConfig, "app")).toBe("app.csrf");
  });

  it("builds with its defaults", () => {
    const config = buildConfig(BaseCsrfConfig);
    expect(config.protectedMethods).toEqual(["POST", "PUT", "PATCH", "DELETE"]);
    expect(config.headerName).toBe("x-stackra-csrf");
    expect(config.tokenCookie).toBe("");
  });

  it("takes a host's override", () => {
    expect(buildConfig(CsrfConfig).tokenCookie).toBe("__Host-csrf");
  });

  it("refuses a header name with upper case", () => {
    class BadCsrfConfig extends BaseCsrfConfig {
      override headerName = "X-Csrf";
    }
    expect(() => buildConfig(BadCsrfConfig)).toThrow(ConfigInvalidError);
  });

  it("ships schema defaults equal to the shape's initializers", () => {
    expect(CSRF_CONFIG_SCHEMA.parse({})).toEqual({ ...new CsrfOptions() });
  });
});
