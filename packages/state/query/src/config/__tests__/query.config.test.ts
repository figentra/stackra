/**
 * Stackra file contract:
 * Purpose: unit and type tests of `QueryConfig`: a configuration over `QueryOptions` keyed `query`, built with its safe
 *          defaults, the template's console and mobile overrides, a runway values layer, a refused value, and the
 *          generated host schema's `Base$.extend(...)` form over `QueryConfig$`.
 * Boundary: test only; the overrides restate the template's `apps/{console,mobile}/src/config/query.config.ts` with
 *           `QueryScope.ActiveScope` in place of the level-named case R-59 removes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 19, 20 and 26); ADR 0059; ADR 0252.
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { QueryConfig } from "#config/query.config";
import type { QueueLeader } from "#contracts/ports/queue-leader.port";
import { QUERY_CONFIG_SCHEMA } from "#core/constants/query-config-schema.constant";
import { QueryScope } from "#core/enums/query-scope.enum";

const BaseQueryConfig = QueryConfig;

/** The console's override. */
class ConsoleQueryConfig extends BaseQueryConfig {
  override scope: QueryScope = QueryScope.ActiveScope;

  override persistEncrypted = true;

  override persistMaxAgeHours = 24;

  override replayOnReconnect = true;

  override queueLeader: DriverName<QueueLeader> = "broadcast_channel";

  override maxParallelAggregates = 4;

  override queueRetentionDays = 7;

  override staleTimeSeconds = 30;

  override refetchOnFocus = true;

  override retry = 2;
}

/** The mobile app's override: no encryption switch, gentle on a phone radio. */
class MobileQueryConfig extends BaseQueryConfig {
  override scope: QueryScope = QueryScope.ActiveScope;

  override persistMaxAgeHours = 24;

  override replayOnReconnect = true;

  override maxParallelAggregates = 2;

  override queueRetentionDays = 7;

  override staleTimeSeconds = 30;

  override refetchOnFocus = true;

  override retry = 2;
}

describe("QueryConfig", () => {
  it("is a configuration keyed query, an override inheriting the key", () => {
    expect(new QueryConfig()).toBeInstanceOf(Config);
    expect(configKey(QueryConfig, "query")).toBe("query");
    expect(configKey(ConsoleQueryConfig, "query")).toBe("query");
  });

  it("types its fields on the class and builds with the safe defaults", () => {
    const config = buildConfig(QueryConfig);
    expectTypeOf(config.scope).toEqualTypeOf<QueryScope>();
    expectTypeOf(config.queueLeader).toEqualTypeOf<DriverName<QueueLeader>>();
    expect({ ...config }).toEqual(QUERY_CONFIG_SCHEMA.parse({}));
    expect(config.scope).toBe(QueryScope.ActiveScope);
    expect(config.persistEncrypted).toBe(true);
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("applies the console and mobile overrides", () => {
    const web = buildConfig(ConsoleQueryConfig);
    expect(web.queueLeader).toBe("broadcast_channel");
    expect(web.staleTimeSeconds).toBe(30);
    expect(web.retry).toBe(2);
    const mobile = buildConfig(MobileQueryConfig);
    expect(mobile.maxParallelAggregates).toBe(2);
    expect(mobile.persistEncrypted).toBe(true);
    expect(mobile.queueLeader).toBe("memory");
  });

  it("takes a runway values layer", () => {
    const config = buildConfig(ConsoleQueryConfig, { values: { maxParallelAggregates: 8 } });
    expect(config.maxParallelAggregates).toBe(8);
    expect(config.staleTimeSeconds).toBe(30);
  });

  it("refuses a value out of range", () => {
    expect(() => buildConfig(QueryConfig, { values: { maxParallelAggregates: 0 } })).toThrow(
      ConfigInvalidError,
    );
  });

  it("is extended by a host's generated schema", () => {
    const { shape } = QUERY_CONFIG_SCHEMA;
    const Host$ = QUERY_CONFIG_SCHEMA.extend({
      maxParallelAggregates: shape.maxParallelAggregates.unwrap().default(2),
      staleTimeSeconds: shape.staleTimeSeconds.unwrap().default(30),
      retry: shape.retry.unwrap().default(2),
    });
    expect(Host$.parse({})).toEqual({ ...buildConfig(MobileQueryConfig) });
  });
});
