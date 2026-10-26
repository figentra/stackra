/**
 * Stackra file contract:
 * Purpose: unit tests of `ValkeyIdempotencyStoreDriver`: it needs the `ACTIONS_VALKEY_URL` secret; a claim holds a
 *          free key with its TTL and answers the record already held; a completed key keeps its lifetime; a release
 *          frees it.
 * Boundary: test only; `iovalkey` is mocked by an in-memory server, so no Valkey runs. The URL is made up.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0136 (decision 3); ADR 0217 (decision 2); ADR 0173.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { StoresConfig } from "#config/stores.config";
import { IdempotencyStore } from "#contracts/index";
import { ValkeyIdempotencyStoreDriver } from "#node/drivers/valkey-idempotency-store.driver";

const server = vi.hoisted(() => ({
  values: new Map<string, string>(),
  evals: [] as unknown[][],
  sets: [] as unknown[][],
  takeAnswer: [1, 4, 0] as unknown,
}));

vi.mock("iovalkey", () => ({
  default: class {
    async eval(script: string, _count: number, key: string, ...argv: string[]) {
      server.evals.push([key, ...argv]);
      if (script.includes("hmget")) return server.takeAnswer;
      const held = server.values.get(key);
      if (held !== undefined) return held;
      server.values.set(key, argv[0] as string);
      return null;
    }

    async set(...args: unknown[]) {
      server.sets.push(args);
      server.values.set(args[0] as string, args[1] as string);
      return "OK";
    }

    async del(key: string) {
      return server.values.delete(key) ? 1 : 0;
    }
  },
}));

class StoreSecrets extends SecretStore {
  get(name: string): string | undefined {
    return name === "ACTIONS_VALKEY_URL" ? "redis://:pw@valkey.test:6379" : undefined;
  }
}

const config = () =>
  buildConfig(StoresConfig, {
    values: { valkey: { keyPrefix: "t:" } },
    secrets: new StoreSecrets(),
  });

describe(ValkeyIdempotencyStoreDriver, () => {
  it("needs its secret", () => {
    expect(() => new ValkeyIdempotencyStoreDriver(buildConfig(StoresConfig))).toThrow(
      /ACTIONS_VALKEY_URL/,
    );
  });

  it("claims, completes and releases a key", async () => {
    const store = new ValkeyIdempotencyStoreDriver(config());
    expect(store).toBeInstanceOf(IdempotencyStore);
    await expect(store.claim("k1", "fp", Duration.hours(24))).resolves.toBeUndefined();
    expect(server.evals.at(-1)).toEqual([
      "t:idempotency:k1",
      '{"fingerprint":"fp","done":false}',
      "86400000",
    ]);
    await expect(store.claim("k1", "fp", Duration.hours(24))).resolves.toEqual({
      fingerprint: "fp",
      done: false,
    });
    await store.complete("k1", { orderId: "ord_1" });
    expect(server.sets.at(-1)).toEqual([
      "t:idempotency:k1",
      '{"fingerprint":"fp","done":true,"output":{"orderId":"ord_1"}}',
      "KEEPTTL",
      "XX",
    ]);
    await store.release("k1");
    expect(server.values.has("t:idempotency:k1")).toBe(false);
  });
});
