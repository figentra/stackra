/**
 * Stackra file contract:
 * Purpose: unit tests of `StoresConfig`, `StoresOptions` and `STORES_CONFIG_SCHEMA`: keyed `actions.stores`, defaults
 *          equal to the initializers (`memory` for both stores), the driver names typed and closed, and the Valkey URL
 *          filled only from its secret.
 * Boundary: test only; the URL is made up.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 4, 19, 20 and 26); ADR 0173.
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

  it("fills the Valkey URL from its secret", () => {
    const secrets = new (class extends SecretStore {
      get(name: string): string | undefined {
        return name === "ACTIONS_VALKEY_URL" ? "redis://valkey.test" : undefined;
      }
    })();
    expect(buildConfig(StoresConfig, { secrets }).valkeyUrl).toBe("redis://valkey.test");
  });
});
