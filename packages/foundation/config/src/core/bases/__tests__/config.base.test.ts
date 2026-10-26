/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `Config({ schema, env })` kind base: the schema's fields are typed on the class
 *          with no `declare` lines, construction copies the schema defaults, a host override under the `Base<Name>`
 *          alias applies its `override` initializers on top, a literal-union field must be restated, the kind
 *          registry keeps the options, an `env` key outside the schema is a type error, and the class is the DI token
 *          (a host override resolves to the same instance).
 * Boundary: test only; registers the schema the way a generated schemas file does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 19, 20
 *                     and 25); ADR 0305 (rules 1 and 34).
 */
import { Container, kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import { Config } from "#core/bases/config.base";
import { buildConfig } from "#core/functions/build-config.function";

class LoyaltyKitOptions extends Schema {
  @Int({
    min: 0,
    max: 100,
  })
  maxRedeemPercent = 50;

  ledger: "memory" | "postgres" = "postgres";
}

registerSchemas([
  [
    LoyaltyKitOptions,
    z.object({
      ledger: z.enum(["memory", "postgres"]).default("postgres"),
      maxRedeemPercent: z.number().int().min(0).max(100).default(50),
    }),
  ],
]);

class LoyaltyKitConfig extends Config({
  schema: LoyaltyKitOptions,
  env: { ledger: "STACKRA_LOYALTY_KIT_LEDGER" },
}) {}

/** A host's override, under the plain name with the package class aliased. */
const BaseLoyaltyKitConfig = LoyaltyKitConfig;

class HostLoyaltyKitConfig extends BaseLoyaltyKitConfig {
  override maxRedeemPercent = 30;

  override ledger: LoyaltyKitOptions["ledger"] = "memory";
}

describe("Config", () => {
  it("types the schema's fields on the class and copies the schema defaults", () => {
    const config = new LoyaltyKitConfig();
    expect({ ...config }).toEqual({ ledger: "postgres", maxRedeemPercent: 50 });
    expect(config).toBeInstanceOf(Config);
    expect(config).toBeInstanceOf(LoyaltyKitConfig);
    expectTypeOf(config.maxRedeemPercent).toEqualTypeOf<number>();
    expectTypeOf(config.ledger).toEqualTypeOf<"memory" | "postgres">();
  });

  it("applies a host override's initializers over the schema defaults", () => {
    expect({ ...new HostLoyaltyKitConfig() }).toEqual({ ledger: "memory", maxRedeemPercent: 30 });
    expect(new HostLoyaltyKitConfig()).toBeInstanceOf(LoyaltyKitConfig);
  });

  it("makes an override of a literal-union field restate the base type", () => {
    class Restated extends LoyaltyKitConfig {
      override ledger: LoyaltyKitOptions["ledger"] = "memory";
    }
    class Bare extends LoyaltyKitConfig {
      // @ts-expect-error -- a bare literal widens to string, which the base type refuses
      override ledger = "memory";
    }
    expect(new Restated().ledger).toBe("memory");
    expect(new Bare().ledger).toBe("memory");
  });

  it("records its kind and options in the kind registry", () => {
    expect(kindOf(LoyaltyKitConfig)).toEqual({
      kind: "config",
      options: { schema: LoyaltyKitOptions, env: { ledger: "STACKRA_LOYALTY_KIT_LEDGER" } },
    });
    expect(kindOf(HostLoyaltyKitConfig)).toBe(kindOf(LoyaltyKitConfig));
  });

  it("refuses an env key that is not a field of the schema", () => {
    // @ts-expect-error -- `ledgr` is not a field of LoyaltyKitOptions
    expect(() => Config({ schema: LoyaltyKitOptions, env: { ledgr: "X" } })).not.toThrow();
  });

  it("refuses a class that extends the bare kind base", () => {
    const Bare = Config as unknown as new () => object;
    class Unconfigured extends Bare {}
    expect(() => new Unconfigured()).toThrow(TypeError);
  });

  it("is the DI token, and a host override resolves to the same instance", async () => {
    const config = buildConfig(HostLoyaltyKitConfig);
    const container = await Container.create(
      [
        {
          member: "loyalty_kit",
          config: [
            { key: "loyalty_kit", provide: LoyaltyKitConfig, override: HostLoyaltyKitConfig },
          ],
        },
      ],
      { overrides: new Map([[LoyaltyKitConfig, config]]) },
    );
    expect(container.get(LoyaltyKitConfig)).toBe(config);
    expect(container.get(HostLoyaltyKitConfig)).toBe(config);
  });
});
