/**
 * Stackra file contract:
 * Purpose: unit tests of `ValkeyRateLimitStoreDriver`: it needs the `ACTIONS_VALKEY_URL` secret; a take maps the
 *          script's answer (allowed, remaining, wait, and a bucket that never refills) to the decision, with the
 *          prefixed key and the caller's `now`.
 * Boundary: test only; `iovalkey` is mocked by an in-memory server, so no Valkey runs. The URL is made up.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0136 (decision 3); ADR 0217 (decision 2); ADR 0173.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { StoresConfig } from "#config/stores.config";
import { RateLimitStore } from "#contracts/index";
import { ValkeyRateLimitStoreDriver } from "#node/drivers/valkey-rate-limit-store.driver";

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

describe(ValkeyRateLimitStoreDriver, () => {
  it("needs its secret", () => {
    expect(() => new ValkeyRateLimitStoreDriver(buildConfig(StoresConfig))).toThrow(
      /ACTIONS_VALKEY_URL/,
    );
  });

  it("maps the bucket script's answer", async () => {
    const store = new ValkeyRateLimitStoreDriver(config());
    expect(store).toBeInstanceOf(RateLimitStore);
    const now = new Date("2026-10-25T09:00:00.000Z");
    await expect(store.take("a", { capacity: 5, tokensPerSecond: 1 }, now)).resolves.toEqual({
      allowed: true,
      remaining: 4,
      retryAfterMs: 0,
    });
    expect(server.evals.at(-1)).toEqual(["t:rate:a", "5", "1", String(now.getTime())]);
    server.takeAnswer = [0, 0, 750];
    await expect(store.take("a", { capacity: 5, tokensPerSecond: 1 }, now)).resolves.toEqual({
      allowed: false,
      remaining: 0,
      retryAfterMs: 750,
    });
    server.takeAnswer = [0, 0, -1];
    expect((await store.take("b", { capacity: 1, tokensPerSecond: 0 }, now)).retryAfterMs).toBe(
      Infinity,
    );
  });
});
