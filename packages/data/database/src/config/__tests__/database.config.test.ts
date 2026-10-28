/**
 * Stackra file contract:
 * Purpose: unit and type tests of `DatabaseConfig`: a configuration over `DatabaseConfigOptions` keyed `database`, built
 *          with its defaults and a runway values layer, refusing a timeout that is not a duration and a pool whose `min`
 *          is above its `max`, the read-your-writes window, and taking the deployment's region key.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 19 and
 *                     20); ADR 0473 (decision 2: the pool).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import { Duration } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { DatabaseConfig } from "#config/database.config";
import { DATABASE_CONFIG_SCHEMA } from "#core/constants/database-config-schema.constant";

describe("DatabaseConfig", () => {
  it("is a configuration keyed database", () => {
    expect(new DatabaseConfig()).toBeInstanceOf(Config);
    expect(configKey(DatabaseConfig, "database")).toBe("database");
  });

  it("types its fields on the class and builds with the defaults", () => {
    const config = buildConfig(DatabaseConfig);
    expectTypeOf(config.health.timeout).toEqualTypeOf<Duration>();
    expect({ ...config }).toEqual(DATABASE_CONFIG_SCHEMA.parse({}));
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("takes a runway values layer and refuses a timeout that is not a duration", () => {
    const values = { health: { timeout: Duration.seconds(1), critical: false } };
    expect(buildConfig(DatabaseConfig, { values }).health).toEqual(values.health);
    expect(() =>
      buildConfig(DatabaseConfig, {
        values: { health: { timeout: "two seconds" as Duration, critical: true } },
      }),
    ).toThrow(ConfigInvalidError);
  });

  it("takes the deployment's region key and refuses one that is not a runway key (stackra-310)", () => {
    expect(buildConfig(DatabaseConfig).region).toBe("");
    expect(buildConfig(DatabaseConfig, { values: { region: "me" } }).region).toBe("me");
    expect(() => buildConfig(DatabaseConfig, { values: { region: "Middle East" } })).toThrow(
      ConfigInvalidError,
    );
  });

  it("ships the pg pool defaults and refuses a pool that keeps more than it may open", () => {
    expect(buildConfig(DatabaseConfig).pool).toEqual({
      max: 10,
      min: 0,
      idleTimeout: Duration.seconds(10),
    });
    expect(() =>
      buildConfig(DatabaseConfig, {
        values: { pool: { max: 2, min: 3, idleTimeout: Duration.seconds(10) } },
      }),
    ).toThrow(ConfigInvalidError);
  });

  it("ships a five-second read-your-writes window and refuses one that is not a duration (STA-1504)", () => {
    expect(buildConfig(DatabaseConfig).readYourWrites).toBe(Duration.seconds(5));
    expect(() =>
      buildConfig(DatabaseConfig, { values: { readYourWrites: "soon" as Duration } }),
    ).toThrow(ConfigInvalidError);
  });

  it("ships the query guard and refuses a repeat limit below one (STA-1400)", () => {
    expect(buildConfig(DatabaseConfig).queries).toEqual({
      slow: Duration.seconds(0.5),
      repeats: 10,
      strict: false,
    });
    expect(() =>
      buildConfig(DatabaseConfig, {
        values: { queries: { slow: Duration.seconds(1), repeats: 0, strict: true } },
      }),
    ).toThrow(ConfigInvalidError);
  });
});
