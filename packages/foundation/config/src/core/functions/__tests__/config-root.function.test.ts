/**
 * Stackra file contract:
 * Purpose: unit tests of `configRoot`: it finds the class directly below the `Config(...)` call through any depth of
 *          host overrides, returns that class for itself, and refuses a class that is not a configuration.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 20);
 *                     ADR 0305 (rule 1).
 */
import { describe, expect, it } from "@stackra/testing";
import { Schema } from "@stackra/validation";

import { Config } from "#core/bases/config.base";
import { configRoot } from "#core/functions/config-root.function";

class Options extends Schema {
  retentionDays = 365;
}

class AccessLogConfig extends Config({ schema: Options }) {}

class HostAccessLogConfig extends AccessLogConfig {
  override retentionDays = 730;
}

class ScopedHostAccessLogConfig extends HostAccessLogConfig {
  override retentionDays = 90;
}

describe("configRoot", () => {
  it("finds the class directly below the Config(...) call", () => {
    expect(configRoot(AccessLogConfig)).toBe(AccessLogConfig);
    expect(configRoot(HostAccessLogConfig)).toBe(AccessLogConfig);
    expect(configRoot(ScopedHostAccessLogConfig)).toBe(AccessLogConfig);
  });

  it("refuses a class that is not a configuration", () => {
    expect(() => configRoot(Options)).toThrow(TypeError);
  });
});
