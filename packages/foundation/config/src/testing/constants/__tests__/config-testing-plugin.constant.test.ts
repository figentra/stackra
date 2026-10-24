/**
 * Stackra file contract:
 * Purpose: unit and type tests of the config testing plugin: `.withConfig(Class, values)` puts a validated, frozen
 *          instance in place of the class and of the base a host override stands in for, calls add up, invalid values
 *          fail at the call; `.withSecrets(map)` binds a `SecretStore` answering only the names given, and a
 *          configuration's secrets come from it in either call order, with a `test-secret:<NAME>` placeholder for one
 *          a test did not set.
 * Boundary: test only; registers a wiring the way gen's vitest setup does, and the plugin by importing the entry.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0263 (decision 12).
 */
import { Module } from "@stackra/container";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import { Config, ConfigInvalidError, Secret, SecretStore } from "#core/index";
import "#testing/index";

class KitOptions extends Schema {
  ledger = "postgres";

  maxRedeemPercent = 50;
}

class DeliveryOptions extends Schema {
  transport = "memory";

  @Secret("WEB_PUSH_VAPID_PRIVATE_KEY")
  webPushVapidPrivateKey!: string;
}

registerSchemas([
  [
    KitOptions,
    z.object({
      ledger: z.enum(["memory", "postgres"]),
      maxRedeemPercent: z.number().int().min(0).max(100),
    }),
  ],
  [DeliveryOptions, z.object({ transport: z.string(), webPushVapidPrivateKey: z.string() })],
]);

class KitConfig extends Config({ schema: KitOptions }) {}

class HostKitConfig extends KitConfig {
  override maxRedeemPercent = 30;
}

class DeliveryConfig extends Config({ schema: DeliveryOptions }) {}

class FixtureModule extends Module {}

beforeEach(() => {
  registerWiring({
    member: "fixture",
    root: FixtureModule,
    config: [
      { key: "kit", provide: KitConfig },
      { key: "fixture.delivery", provide: DeliveryConfig },
    ],
  });
});

describe("CONFIG_TESTING_PLUGIN", () => {
  it("puts a validated, frozen instance in place of the class", async () => {
    const app = await createTestingModule(FixtureModule)
      .withConfig(KitConfig, { ledger: "memory", maxRedeemPercent: 30 })
      .compile();
    const config = app.get(KitConfig);
    expect(config).toBeInstanceOf(KitConfig);
    expect({ ...config }).toEqual({ ledger: "memory", maxRedeemPercent: 30 });
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("adds up calls for the same class", async () => {
    const app = await createTestingModule(FixtureModule)
      .withConfig(KitConfig, { ledger: "memory" })
      .withConfig(KitConfig, { maxRedeemPercent: 10 })
      .compile();
    expect({ ...app.get(KitConfig) }).toEqual({ ledger: "memory", maxRedeemPercent: 10 });
  });

  it("puts a host override's instance in place of its base too", async () => {
    const app = await createTestingModule(FixtureModule)
      .withConfig(HostKitConfig, { ledger: "memory" })
      .compile();
    expect(app.get(KitConfig)).toBe(app.get(HostKitConfig));
    expect(app.get(KitConfig).maxRedeemPercent).toBe(30);
  });

  it("fails at the call on an invalid value", () => {
    expect(() =>
      createTestingModule(FixtureModule).withConfig(KitConfig, { maxRedeemPercent: 500 }),
    ).toThrow(ConfigInvalidError);
  });

  it("refuses a field the configuration does not have", () => {
    expect(() =>
      // @ts-expect-error -- `nope` is not a field of KitConfig
      createTestingModule(FixtureModule).withConfig(KitConfig, { nope: 1 }),
    ).not.toThrow();
  });

  it("binds a SecretStore that answers only the names given", async () => {
    const app = await createTestingModule(FixtureModule)
      .withSecrets({ RESEND_WEBHOOK_SECRET: "whsec_test" })
      .withSecrets({ RESEND_API_KEY: "re_test" })
      .compile();
    const store = app.get(SecretStore);
    expect(store).toBeInstanceOf(SecretStore);
    expect(store.get("RESEND_WEBHOOK_SECRET")).toBe("whsec_test");
    expect(store.get("RESEND_API_KEY")).toBe("re_test");
    expect(store.get("UNKNOWN")).toBeUndefined();
  });

  it("resolves a configuration's secrets from withSecrets in either order, with a placeholder otherwise", async () => {
    const before = await createTestingModule(FixtureModule)
      .withSecrets({ WEB_PUSH_VAPID_PRIVATE_KEY: "vapid_test" })
      .withConfig(DeliveryConfig, { transport: "resend" })
      .compile();
    const after = await createTestingModule(FixtureModule)
      .withConfig(DeliveryConfig, { transport: "resend" })
      .withSecrets({ WEB_PUSH_VAPID_PRIVATE_KEY: "vapid_test" })
      .compile();
    const unset = await createTestingModule(FixtureModule).withConfig(DeliveryConfig, {}).compile();
    expect(before.get(DeliveryConfig).webPushVapidPrivateKey).toBe("vapid_test");
    expect(after.get(DeliveryConfig).webPushVapidPrivateKey).toBe("vapid_test");
    expect(unset.get(DeliveryConfig).webPushVapidPrivateKey).toBe(
      "test-secret:WEB_PUSH_VAPID_PRIVATE_KEY",
    );
    expect(JSON.stringify(before.get(DeliveryConfig))).not.toContain("vapid_test");
  });
});
