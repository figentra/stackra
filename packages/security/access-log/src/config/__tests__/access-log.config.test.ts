/**
 * Stackra file contract:
 * Purpose: unit tests of `AccessLogConfig`: a configuration keyed `access_log` that builds with the shipped defaults,
 *          reads the sink from `STACKRA_ACCESS_LOG_SINK`, takes a host override, and refuses an unknown sink or a
 *          retention under 90 days.
 * Boundary: test only; pure configuration building, no container.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0146 as amended; ADR 0294 (decision 19); ADR 0212 (decision 6).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { AccessLogConfig } from "#config/access-log.config";
import type { AccessLogSink } from "#contracts/ports/access-log-sink.port";
import { ACCESS_LOG_CONFIG_SCHEMA } from "#core/constants/access-log-config-schema.constant";

/** A host override, under the plain name with the package class aliased. */
const BaseAccessLogConfig = AccessLogConfig;

class HostAccessLogConfig extends BaseAccessLogConfig {
  override retentionDays = 730;
}

describe("AccessLogConfig", () => {
  it("is a configuration keyed access_log, an override inheriting the key", () => {
    expect(new AccessLogConfig()).toBeInstanceOf(Config);
    expect(configKey(AccessLogConfig, "access_log")).toBe("access_log");
    expect(configKey(HostAccessLogConfig, "access_log")).toBe("access_log");
  });

  it("types its fields on the class and builds with the defaults", () => {
    const config = buildConfig(AccessLogConfig);
    expectTypeOf(config.sink).toEqualTypeOf<DriverName<AccessLogSink>>();
    expectTypeOf(config.retentionDays).toEqualTypeOf<number>();
    expect({ ...config }).toEqual(ACCESS_LOG_CONFIG_SCHEMA.parse({}));
    expect(config.sink).toBe("postgres");
    expect(config.retentionDays).toBe(400);
  });

  it("reads the sink from the environment and takes a host override", () => {
    expect(buildConfig(AccessLogConfig, { env: { STACKRA_ACCESS_LOG_SINK: "memory" } }).sink).toBe(
      "memory",
    );
    expect(buildConfig(HostAccessLogConfig).retentionDays).toBe(730);
  });

  it("refuses a sink no one ships and a retention under 90 days", () => {
    expect(() =>
      buildConfig(AccessLogConfig, {
        values: { sink: "siem" as DriverName<AccessLogSink> },
      }),
    ).toThrow(ConfigInvalidError);
    expect(() => buildConfig(AccessLogConfig, { values: { retentionDays: 30 } })).toThrow(
      ConfigInvalidError,
    );
  });
});
