/**
 * Stackra file contract:
 * Purpose: unit tests of `ValkeyIdempotencyStoreDriver`: it needs the `ACTIONS_VALKEY_URL` secret; a claim holds a
 *          free key for its lease with a holder token and answers the record already held without it; a completion
 *          writes the done record for the replay window; a release frees only this process's own held claim, never a
 *          done record or a claim another call took after the lease lapsed, and a completion never overwrites one.
 * Boundary: test only; `iovalkey` is mocked by an in-memory server that runs the driver's three scripts by their shape
 *           (claim, compare-and-set, compare-and-delete), so no Valkey runs. The URL is made up.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0136 (decision 3); ADR 0217 (decision 2); ADR 0173.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { Duration } from "@stackra/contracts";
import { ErrorKind } from "@stackra/errors";
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
      const now = server.values.get(key);
      // release: delete only while the key still holds the given claim
      if (script.includes("'del'")) return now === argv[0] && server.values.delete(key) ? 1 : 0;
      // complete: write only while the key holds the given claim or is free
      if (script.includes("~=")) {
        if (now !== undefined && now !== argv[0]) return 0;
        server.values.set(key, argv[1] as string);
        return 1;
      }
      if (now !== undefined) return now;
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

  it("claims for the lease, completes for the window, and never releases a done key", async () => {
    const store = new ValkeyIdempotencyStoreDriver(config());
    expect(store).toBeInstanceOf(IdempotencyStore);
    await expect(store.claim("k1", "fp", Duration.minutes(15))).resolves.toBeUndefined();
    const [key, held, lease] = server.evals.at(-1) as string[];
    expect([key, lease]).toEqual(["t:idempotency:k1", "900000"]);
    expect(JSON.parse(held as string)).toEqual({
      fingerprint: "fp",
      done: false,
      holder: expect.any(String),
    });
    await expect(store.claim("k1", "fp", Duration.minutes(15))).resolves.toEqual({
      fingerprint: "fp",
      done: false,
    });
    await store.complete("k1", "fp", { orderId: "ord_1" }, Duration.hours(24));
    expect(server.evals.at(-1)).toEqual([
      "t:idempotency:k1",
      held,
      '{"fingerprint":"fp","done":true,"output":{"orderId":"ord_1"}}',
      "86400000",
    ]);
    // a release after the completion (the pipeline never sends one, a stray one must not undo it) leaves it
    await store.release("k1");
    await expect(store.claim("k1", "fp", Duration.minutes(15))).resolves.toEqual({
      fingerprint: "fp",
      done: true,
      output: { orderId: "ord_1" },
    });
  });

  it("releases its own held claim, but not one another call took after its lease lapsed", async () => {
    const mine = new ValkeyIdempotencyStoreDriver(config());
    await mine.claim("k3", "fp", Duration.minutes(15));
    await mine.release("k3");
    expect(server.values.has("t:idempotency:k3")).toBe(false);
    await mine.claim("k4", "fp", Duration.minutes(15));
    // the lease lapsed and another instance claimed the key
    server.values.delete("t:idempotency:k4");
    const other = new ValkeyIdempotencyStoreDriver(config());
    await other.claim("k4", "fp", Duration.minutes(15));
    const theirs = server.values.get("t:idempotency:k4");
    await mine.release("k4");
    expect(server.values.get("t:idempotency:k4")).toBe(theirs);
    // and a late completion of the first claim does not overwrite theirs either
    await mine.complete("k4", "fp", { orderId: "ord_9" }, Duration.hours(24));
    expect(server.values.get("t:idempotency:k4")).toBe(theirs);
  });

  it("lands a late completion on a key whose lease lapsed with nobody holding it", async () => {
    const store = new ValkeyIdempotencyStoreDriver(config());
    await store.claim("k5", "fp", Duration.minutes(15));
    server.values.delete("t:idempotency:k5");
    await store.complete("k5", "fp", 7, Duration.hours(24));
    await expect(store.claim("k5", "fp", Duration.minutes(15))).resolves.toEqual({
      fingerprint: "fp",
      done: true,
      output: 7,
    });
  });

  it("writes a refusal whole, claimed or not, and a later claim reads it back", async () => {
    const store = new ValkeyIdempotencyStoreDriver(config());
    const refusal = {
      kind: ErrorKind.Conflict,
      code: "out_of_stock",
      category: "conflict",
      retryable: false,
    } as const;
    await store.completeRefused("k2", "fp", refusal, Duration.hours(24));
    expect(server.sets.at(-1)).toEqual([
      "t:idempotency:k2",
      JSON.stringify({ fingerprint: "fp", done: true, refusal }),
      "PX",
      86_400_000,
    ]);
    await expect(store.claim("k2", "fp", Duration.hours(24))).resolves.toEqual({
      fingerprint: "fp",
      done: true,
      refusal,
    });
  });
});
