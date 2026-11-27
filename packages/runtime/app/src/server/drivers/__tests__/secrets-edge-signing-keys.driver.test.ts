/**
 * Stackra file contract:
 * Purpose: unit tests of `SecretsEdgeSigningKeysDriver`: it reads the keys from the bound `SecretStore` by the
 *          configured name, newest first with blanks dropped, on every call (a rotation the store reloads is answered at
 *          once, with no new driver or config), answers no key when the secret is unset, and rejects when the store
 *          throws, so the guard fails closed.
 * Boundary: test only; the config is built from the shipped schema and the store is a test-local map. The values are
 *           test strings, never secrets.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0437 (decision 4: two keys, rotated without a cut-over); ADR 0173.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { describe, expect, it } from "@stackra/testing";

import { EdgeConfig as BaseEdgeConfig } from "#config/edge.config";
import { EdgeSigningKeys } from "#contracts/ports/edge-signing-keys.port";
import { SecretsEdgeSigningKeysDriver } from "#server/drivers/secrets-edge-signing-keys.driver";

/** A store whose values a test changes, as a reload after a rotation does. */
class MapSecretStore extends SecretStore {
  readonly values = new Map<string, string>();

  failing = false;

  get(name: string): string | undefined {
    if (this.failing) throw new Error("the secret store is not loaded");
    return this.values.get(name);
  }
}

describe("SecretsEdgeSigningKeysDriver", () => {
  it("is a driver of the EdgeSigningKeys port", () => {
    expect(
      new SecretsEdgeSigningKeysDriver(new MapSecretStore(), buildConfig(BaseEdgeConfig)),
    ).toBeInstanceOf(EdgeSigningKeys);
  });

  it("answers the store's keys under the default name, newest first, blanks dropped", async () => {
    const store = new MapSecretStore();
    store.values.set("STACKRA_EDGE_SIGNING_KEYS", " next , ,previous ");
    const keys = new SecretsEdgeSigningKeysDriver(store, buildConfig(BaseEdgeConfig));
    await expect(keys.active()).resolves.toEqual(["next", "previous"]);
  });

  it("answers a rotation the store reloads on the next call, with no restart", async () => {
    const store = new MapSecretStore();
    store.values.set("STACKRA_EDGE_SIGNING_KEYS", "first");
    const keys = new SecretsEdgeSigningKeysDriver(store, buildConfig(BaseEdgeConfig));
    await expect(keys.active()).resolves.toEqual(["first"]);
    store.values.set("STACKRA_EDGE_SIGNING_KEYS", "second,first");
    await expect(keys.active()).resolves.toEqual(["second", "first"]);
    store.values.set("STACKRA_EDGE_SIGNING_KEYS", "second");
    await expect(keys.active()).resolves.toEqual(["second"]);
  });

  it("reads the secret the config names, and refuses a name that is not SCREAMING_SNAKE", async () => {
    class EdgeConfig extends BaseEdgeConfig {
      override signingKeysSecret = "EU_EDGE_SIGNING_KEYS";
    }
    const store = new MapSecretStore();
    store.values.set("STACKRA_EDGE_SIGNING_KEYS", "default");
    store.values.set("EU_EDGE_SIGNING_KEYS", "regional");
    await expect(
      new SecretsEdgeSigningKeysDriver(store, buildConfig(EdgeConfig)).active(),
    ).resolves.toEqual(["regional"]);
    expect(() =>
      buildConfig(BaseEdgeConfig, { values: { signingKeysSecret: "edge-keys" } }),
    ).toThrow();
  });

  it("answers no key when the secret is unset or blank", async () => {
    const store = new MapSecretStore();
    const keys = new SecretsEdgeSigningKeysDriver(store, buildConfig(BaseEdgeConfig));
    await expect(keys.active()).resolves.toEqual([]);
    store.values.set("STACKRA_EDGE_SIGNING_KEYS", " , ");
    await expect(keys.active()).resolves.toEqual([]);
  });

  it("rejects when the store throws, so the check fails closed", async () => {
    const store = new MapSecretStore();
    store.failing = true;
    await expect(
      new SecretsEdgeSigningKeysDriver(store, buildConfig(BaseEdgeConfig)).active(),
    ).rejects.toThrow("the secret store is not loaded");
  });
});
