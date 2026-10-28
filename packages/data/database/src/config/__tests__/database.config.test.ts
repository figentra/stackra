/**
 * Stackra file contract:
 * Purpose: unit and type tests of `DatabaseConfig`: a configuration over `DatabaseConfigOptions` keyed `database`, built
 *          with its defaults and a runway values layer, refusing a timeout that is not a duration.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 19 and
 *                     20).
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
});
