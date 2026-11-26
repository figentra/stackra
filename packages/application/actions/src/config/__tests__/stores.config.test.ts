/**
 * Stackra file contract:
 * Purpose: unit tests of `StoresConfig`, `StoresOptions` and `STORES_CONFIG_SCHEMA`: keyed `actions.stores`, defaults
 *          equal to the initializers (`memory` for both stores, `dev`), the driver names typed and closed, the Valkey URL
 *          filled only from its secret, and the boot refusal of a `memory` store outside `dev` and `test` (STA-2798).
 * Boundary: test only; the URL is made up.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 4, 19, 20 and 26); ADR 0173; ADR 0266 (decision 2);
 *                     STA-2798.
 */
import { buildConfig, ConfigInvalidError, configKey } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import type { DriverName } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { StoresConfig } from "#config/stores.config";
import type { IdempotencyStore } from "#contracts/ports/idempotency-store.port";
import type { RateLimitStore } from "#contracts/ports/rate-limit-store.port";
import { STORES_CONFIG_SCHEMA } from "#core/constants/stores-config-schema.constant";
import { StoresOptions } from "#core/schemas/stores-options.schema";

describe("StoresConfig", () => {
  it("is keyed actions.stores with memory defaults", () => {
    expect(configKey(StoresConfig, "actions")).toBe("actions.stores");
    expect(schemaOf(StoresOptions)).toBe(STORES_CONFIG_SCHEMA);
    expect({ ...new StoresOptions() }).toEqual(STORES_CONFIG_SCHEMA.parse({}));
    expect(STORES_CONFIG_SCHEMA.parse({})).toEqual({
      idempotency: "memory",
      rateLimit: "memory",
      valkeyUrl: "",
      valkey: { keyPrefix: "actions:" },
      environment: "dev",
    });
  });

  it("types and closes the driver names", () => {
    expectTypeOf<DriverName<IdempotencyStore>>().toEqualTypeOf<"memory" | "valkey" | "postgres">();
    expectTypeOf<DriverName<RateLimitStore>>().toEqualTypeOf<"memory" | "valkey" | "postgres">();
    expect(() =>
      buildConfig(StoresConfig, {
        values: { idempotency: "redis" as DriverName<IdempotencyStore> },
      }),
    ).toThrow(ConfigInvalidError);
  });

  it("selects the Postgres stores of @stackra/database by name (STA-756)", () => {
    const config = buildConfig(StoresConfig, {
      values: { idempotency: "postgres", rateLimit: "postgres" },
    });
    expect([config.idempotency, config.rateLimit]).toEqual(["postgres", "postgres"]);
  });

  it("reads the running environment from STACKRA_ENVIRONMENT, dev when unset", () => {
    expect(buildConfig(StoresConfig).environment).toBe("dev");
    expect(buildConfig(StoresConfig, { env: { STACKRA_ENVIRONMENT: "test" } }).environment).toBe(
      "test",
    );
  });

  it.each(["preview", "staging", "production"])(
    "refuses the memory stores at boot in %s, naming each field",
    (environment) => {
      const build = () => buildConfig(StoresConfig, { env: { STACKRA_ENVIRONMENT: environment } });
      expect(build).toThrow(ConfigInvalidError);
      const issues = (() => {
        try {
          build();
        } catch (error) {
          return (error as ConfigInvalidError).issues;
        }
        return [];
      })();
      expect(issues.map(({ path }) => path)).toEqual(["idempotency", "rateLimit"]);
      expect(issues[0]?.message).toContain(`${environment} refuses it`);
      expect(issues[0]?.message).toContain("config.actions.stores.idempotency");
      expect(issues[1]?.message).toContain("token buckets");
    },
  );

  it("refuses a deployed environment that keeps only one store in memory", () => {
    expect(() =>
      buildConfig(StoresConfig, {
        env: { STACKRA_ENVIRONMENT: "production" },
        values: { idempotency: "postgres" },
      }),
    ).toThrow(/rateLimit: the memory store keeps the rate limit's token buckets/);
  });

  it.each([
    ["production", "postgres", "postgres"],
    ["staging", "postgres", "valkey"],
    ["preview", "valkey", "valkey"],
  ] as const)("boots %s with durable stores", (environment, idempotency, rateLimit) => {
    const config = buildConfig(StoresConfig, {
      env: { STACKRA_ENVIRONMENT: environment },
      values: { idempotency, rateLimit },
    });
    expect([config.environment, config.idempotency, config.rateLimit]).toEqual([
      environment,
      idempotency,
      rateLimit,
    ]);
  });

  it.each(["dev", "test"])("keeps the memory stores in %s", (environment) => {
    const config = buildConfig(StoresConfig, { env: { STACKRA_ENVIRONMENT: environment } });
    expect([config.idempotency, config.rateLimit]).toEqual(["memory", "memory"]);
  });

  it("refuses an unknown environment instead of running it as dev", () => {
    expect(() => buildConfig(StoresConfig, { env: { STACKRA_ENVIRONMENT: "prod" } })).toThrow(
      /environment: .*\(STACKRA_ENVIRONMENT\)/,
    );
  });

  it("fills the Valkey URL from its secret", () => {
    const secrets = new (class extends SecretStore {
      get(name: string): string | undefined {
        return name === "ACTIONS_VALKEY_URL" ? "redis://valkey.test" : undefined;
      }
    })();
    expect(buildConfig(StoresConfig, { secrets }).valkeyUrl).toBe("redis://valkey.test");
  });
});
