/**
 * Stackra file contract:
 * Purpose: unit tests of `buildConfig`: the layers apply in order (schema defaults, host override, env map, values),
 *          environment strings are coerced to the field's type, a nested object is replaced whole, the result is
 *          validated and frozen, errors name the path and the variable but never the value, and a `@Secret` field is
 *          resolved blind through the `SecretStore`, never set by a layer and never visible to `JSON.stringify`,
 *          `Object.keys`, spreads, `util.inspect` or an error message.
 * Boundary: test only; registers the schemas the way a generated schemas file does and binds an in-memory store.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 19);
 *                     ADR 0296 (decision 1); ADR 0173.
 */
import { inspect } from "node:util";

import { Driver } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import { SecretStore } from "#contracts/ports/secret-store.port";
import { Config } from "#core/bases/config.base";
import { Secret } from "#core/decorators/secret.decorator";
import { ConfigInvalidError } from "#core/errors/config-invalid.error";
import { buildConfig } from "#core/functions/build-config.function";

/** A value no output may contain. */
const CANARY = "sk_live_canary_0123456789";

class MemorySecretStoreDriver extends Driver(SecretStore) {
  readonly values = new Map<string, string>();

  get(name: string): string | undefined {
    return this.values.get(name);
  }
}

class KitOptions extends Schema {
  ledger = "postgres";

  maxRedeemPercent = 50;

  audit = false;

  ledgers: Record<string, string> = { primary: "postgres" };
}

class CommerceOptions extends Schema {
  @Secret("PRICING_API_KEY")
  pricingApiKey!: string;

  @Secret("PRICING_WEBHOOK_SECRET")
  webhookSecret?: string;

  storefrontBaseUrl!: string;
}

registerSchemas([
  [
    KitOptions,
    z.object({
      ledger: z.enum(["memory", "postgres"]),
      maxRedeemPercent: z.number().int().min(0).max(100),
      audit: z.boolean(),
      ledgers: z.record(z.string(), z.string()),
    }),
  ],
  [
    CommerceOptions,
    z.object({
      storefrontBaseUrl: z.url(),
      pricingApiKey: z.string().min(40),
      webhookSecret: z.string().optional(),
    }),
  ],
]);

class KitConfig extends Config({
  schema: KitOptions,
  env: {
    ledger: "STACKRA_KIT_LEDGER",
    maxRedeemPercent: "STACKRA_KIT_MAX",
    audit: "STACKRA_KIT_AUDIT",
    ledgers: "STACKRA_KIT_LEDGERS",
  },
}) {}

const BaseKitConfig = KitConfig;

class HostKitConfig extends BaseKitConfig {
  override maxRedeemPercent = 30;

  override ledgers: Record<string, string> = { primary: "memory", replica: "memory" };
}

class CommerceConfig extends Config({
  schema: CommerceOptions,
  env: { storefrontBaseUrl: "STACKRA_STOREFRONT_BASE_URL" },
}) {}

/** A store holding a valid pricing key. */
function storeWithKey(value = `${CANARY}${"x".repeat(20)}`): MemorySecretStoreDriver {
  const store = new MemorySecretStoreDriver();
  store.values.set("PRICING_API_KEY", value);
  return store;
}

/** Builds KitConfig with a percentage above the rule's 100. */
const buildOutOfRange = () => buildConfig(KitConfig, { env: { STACKRA_KIT_MAX: "150" } });

describe("buildConfig", () => {
  it("returns a frozen instance of the class holding the schema defaults", () => {
    const config = buildConfig(KitConfig);
    expect(config).toBeInstanceOf(KitConfig);
    expect(Object.isFrozen(config)).toBe(true);
    expect({ ...config }).toEqual({
      ledger: "postgres",
      maxRedeemPercent: 50,
      audit: false,
      ledgers: { primary: "postgres" },
    });
    expectTypeOf(config).toEqualTypeOf<KitConfig>();
  });

  it("layers the host override, then the env map, then the values", () => {
    expect(buildConfig(HostKitConfig).maxRedeemPercent).toBe(30);
    expect(buildConfig(HostKitConfig, { env: { STACKRA_KIT_MAX: "70" } }).maxRedeemPercent).toBe(
      70,
    );
    const config = buildConfig(HostKitConfig, {
      env: { STACKRA_KIT_MAX: "70", STACKRA_KIT_LEDGER: "memory", UNMAPPED: "ignored" },
      values: { maxRedeemPercent: 10 },
    });
    expect(config.maxRedeemPercent).toBe(10);
    expect(config.ledger).toBe("memory");
    expect("UNMAPPED" in config).toBe(false);
  });

  it("coerces environment strings to the type of the value they replace", () => {
    const config = buildConfig(KitConfig, {
      env: {
        STACKRA_KIT_MAX: "25",
        STACKRA_KIT_AUDIT: "true",
        STACKRA_KIT_LEDGERS: '{"primary":"memory"}',
      },
    });
    expect(config.maxRedeemPercent).toBe(25);
    expect(config.audit).toBe(true);
    expect(config.ledgers).toEqual({ primary: "memory" });
    expect(buildConfig(KitConfig, { env: { STACKRA_KIT_AUDIT: "0" } }).audit).toBe(false);
  });

  it("replaces a nested object whole", () => {
    expect(buildConfig(HostKitConfig).ledgers).toEqual({ primary: "memory", replica: "memory" });
    expect(
      buildConfig(HostKitConfig, { values: { ledgers: { archive: "postgres" } } }).ledgers,
    ).toEqual({
      archive: "postgres",
    });
  });

  it("refuses an invalid value, naming the path and the variable but not the value", () => {
    expect(buildOutOfRange).toThrow(ConfigInvalidError);
    expect(buildOutOfRange).toThrow(/maxRedeemPercent: .*\(STACKRA_KIT_MAX\)/);
    expect(buildOutOfRange).not.toThrow(/150/);
    expect(() => buildConfig(KitConfig, { env: { STACKRA_KIT_MAX: "" } })).toThrow(
      ConfigInvalidError,
    );
    expect(() => buildConfig(KitConfig, { env: { STACKRA_KIT_LEDGERS: "{not json" } })).toThrow(
      /ledgers/,
    );
  });

  it("resolves a secret by name and keeps it off every serialisation", () => {
    const value = `${CANARY}${"x".repeat(20)}`;
    const config = buildConfig(CommerceConfig, {
      env: { STACKRA_STOREFRONT_BASE_URL: "https://shop.acme.example" },
      secrets: storeWithKey(value),
    });
    expect(config.pricingApiKey).toBe(value);
    expect(config.webhookSecret).toBeUndefined();
    expect(JSON.stringify(config)).not.toContain(CANARY);
    expect(Object.keys(config)).not.toContain("pricingApiKey");
    expect({ ...config }).not.toHaveProperty("pricingApiKey");
    expect(inspect(config)).not.toContain(CANARY);
    expect(inspect(config, { depth: 5 })).not.toContain(CANARY);
    expect(String(config)).not.toContain(CANARY);
    expect(() => {
      (config as { pricingApiKey: string }).pricingApiKey = "other";
    }).toThrow(TypeError);
  });

  it("fails on a missing or invalid secret, naming it but never printing it", () => {
    const env = { STACKRA_STOREFRONT_BASE_URL: "https://shop.acme.example" };
    expect(() => buildConfig(CommerceConfig, { env })).toThrow(
      /secret PRICING_API_KEY is missing or invalid/,
    );
    expect(() =>
      buildConfig(CommerceConfig, { env, secrets: new MemorySecretStoreDriver() }),
    ).toThrow(ConfigInvalidError);
    let message = "";
    try {
      buildConfig(CommerceConfig, { env, secrets: storeWithKey(CANARY) }); // shorter than the rule's 40
    } catch (error) {
      message = `${String(error)} ${JSON.stringify(error)} ${inspect(error)}`;
    }
    expect(message).toContain("PRICING_API_KEY");
    expect(message).not.toContain(CANARY);
  });

  it("refuses a secret field set by the env map or the values layer", () => {
    class LeakyConfig extends Config({
      schema: CommerceOptions,
      env: { pricingApiKey: "PRICING_API_KEY" },
    }) {}
    expect(() => buildConfig(LeakyConfig, { env: { PRICING_API_KEY: CANARY } })).toThrow(TypeError);
    expect(() =>
      buildConfig(CommerceConfig, { values: { pricingApiKey: CANARY }, secrets: storeWithKey() }),
    ).toThrow(TypeError);
  });

  it("refuses a class that is not a configuration, and a schema with no generated schema", () => {
    class Unregistered extends Schema {
      name = "";
    }
    class UnregisteredConfig extends Config({ schema: Unregistered }) {}
    expect(() => buildConfig(UnregisteredConfig)).toThrow(/no registered schema/);
    expect(() => buildConfig(class Plain {} as never)).toThrow(TypeError);
  });
});
