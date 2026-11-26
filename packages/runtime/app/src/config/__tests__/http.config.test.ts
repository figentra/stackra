/**
 * Stackra file contract:
 * Purpose: unit tests of `HttpConfig`: keyed `app.http`, built with a 1 MiB body cap, a host override, a zero cap
 *          refused; the shipped schema's default equals `HttpOptions`' initializer.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 19, 20 and 26); ADR 0237 (STA-2577 note).
 */
import { buildConfig, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { HttpConfig as BaseHttpConfig } from "#config/http.config";
import { HTTP_CONFIG_SCHEMA } from "#core/constants/http-config-schema.constant";
import { HttpOptions } from "#core/schemas/http-options.schema";

describe("HttpConfig", () => {
  it("is keyed app.http", () => {
    expect(configKey(BaseHttpConfig, "app")).toBe("app.http");
  });

  it("caps a body at 1 MiB by default", () => {
    expect(buildConfig(BaseHttpConfig).maxBodyBytes).toBe(1_048_576);
  });

  it("takes a host's override", () => {
    class HttpConfig extends BaseHttpConfig {
      override maxBodyBytes = 4096;
    }
    expect(buildConfig(HttpConfig).maxBodyBytes).toBe(4096);
  });

  it("refuses a zero cap", () => {
    class ZeroHttpConfig extends BaseHttpConfig {
      override maxBodyBytes = 0;
    }
    expect(() => buildConfig(ZeroHttpConfig)).toThrow(ConfigInvalidError);
  });

  it("ships a schema default equal to the shape's initializer", () => {
    expect(HTTP_CONFIG_SCHEMA.parse({})).toEqual({ ...new HttpOptions() });
  });
});
