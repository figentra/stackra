/**
 * Stackra file contract:
 * Purpose: integration tests of the shared edge nonce store on real Postgres: two `EdgeHeaderGuard`s (two API
 *          instances of a region) whose `cache` nonce stores reach one `postgres` `Cache` driver each over the same
 *          tables; a signed request accepted by one instance is refused as a replay by the other, concurrent deliveries
 *          of one signed request to both instances let exactly one through, and a request id is free again once its
 *          claim's row has expired.
 * Boundary: integration tier (`.int`): needs Postgres for `usePostgres` (Testcontainers). The `cache` schema and its tables are made with
 *           `postgresCacheTables("cache")`; `CacheSql` runs each statement on a forked entity manager, outside any
 *           transaction, as @stackra/database binds it. The signing keys are test strings, never secrets.
 * Runtime: node (vitest)
 * Governing contract: ADR 0437 (decision 4 and Enforcement: a shared nonce store, `Cache.add`); ADR 0150; ADR 0182;
 *                     ADR 0022; ADR 0269.
 */
import { createHash } from "node:crypto";

import { buildConfig } from "@stackra/config";
import {
  CacheConfig,
  LocalCacheLockDriver,
  NoneCacheMetricsDriver,
  SharedCacheNamespaceDriver,
} from "@stackra/cache";
import { CacheSql } from "@stackra/cache/contracts";
import { PostgresCacheDriver, postgresCacheTables } from "@stackra/cache/node";
import { Driver } from "@stackra/container";
import { Clock } from "@stackra/contracts";
import { usePostgres } from "@stackra/database/testing";
import { isRefusal } from "@stackra/errors";
import { beforeAll, describe, expect, it } from "@stackra/testing";

import { EdgeHeader } from "#contracts/enums/edge-header.enum";
import { signEdgeRequest } from "#core/functions/sign-edge-request.function";
import { CacheEdgeNonceStoreDriver } from "#server/drivers/cache-edge-nonce-store.driver";
import { MemoryEdgeSigningKeysDriver } from "#server/drivers/memory-edge-signing-keys.driver";
import { EdgeSignatureInvalidError } from "#server/errors/edge-signature-invalid.error";
import { EdgeHeaderGuard } from "#server/services/edge-header.guard";

const postgres = usePostgres({ entities: [] });

/** Runs the cache driver's statements on the test database, each on its own. */
class TestCacheSql extends Driver(CacheSql) {
  async query(
    sql: string,
    params: readonly unknown[],
  ): Promise<readonly Record<string, unknown>[]> {
    return (await postgres.database
      .em()
      .fork()
      .execute(sql, [...params])) as unknown as readonly Record<string, unknown>[];
  }
}

/** A clock a test moves past a claim's window; the guard's own timestamp check stays on real time. */
class ShiftedClock extends Clock {
  shift = 0;

  now(): Date {
    return new Date(Date.now() + this.shift);
  }
}

const clock = new ShiftedClock();

beforeAll(async () => {
  // raw-sql: test setup; the schema the 0005 migration of @stackra/database makes in a service
  await new TestCacheSql().query('create schema if not exists "cache"', []);
  for (const { statement } of postgresCacheTables("cache"))
    await new TestCacheSql().query(statement, []);
});

/** One API instance: its own guard, signing keys and `postgres` cache driver over the shared tables. */
function instance(): EdgeHeaderGuard {
  const keys = new MemoryEdgeSigningKeysDriver();
  keys.secrets = ["next"];
  const cache = new PostgresCacheDriver(
    buildConfig(CacheConfig, {
      values: { driver: "postgres", postgres: { schema: "cache", sweep: 100 } },
    }),
    new TestCacheSql(),
    new SharedCacheNamespaceDriver(),
    clock,
    new LocalCacheLockDriver(),
    new NoneCacheMetricsDriver(),
  );
  return new EdgeHeaderGuard(keys, new CacheEdgeNonceStoreDriver(cache));
}

/** A request as the edge Worker forwards it, signed with `next`. */
async function forwarded(requestId: string): Promise<Request> {
  const body = '{"total":10}';
  const input = {
    scope: "scp_01j9z3k4m5n6p7q8r9s0t1v2wa",
    product: "commerce",
    surface: "console",
    realm: "staff",
    requestId,
    timestamp: Math.floor(Date.now() / 1000),
    method: "POST",
    path: "/api/orders",
    bodyHash: createHash("sha256").update(body).digest("hex"),
  };
  return new Request("https://api.example.test/api/orders", {
    method: "POST",
    headers: {
      [EdgeHeader.Scope]: input.scope,
      [EdgeHeader.Product]: input.product,
      [EdgeHeader.Surface]: input.surface,
      [EdgeHeader.Realm]: input.realm,
      [EdgeHeader.RequestId]: input.requestId,
      [EdgeHeader.Timestamp]: String(input.timestamp),
      [EdgeHeader.Signature]: await signEdgeRequest(input, "next"),
    },
    body,
  });
}

/** Whether `guard` let `request` through (false when it refused it as an invalid edge signature). */
async function passes(guard: EdgeHeaderGuard, request: Request): Promise<boolean> {
  try {
    await guard.check(request);
    return true;
  } catch (error) {
    if (isRefusal(error, EdgeSignatureInvalidError)) return false;
    throw error;
  }
}

describe("the cache edge nonce store on real Postgres", () => {
  it("refuses on a second instance a request the first accepted", async () => {
    const captured = await forwarded("req-replayed");
    const replay = captured.clone();
    await expect(passes(instance(), captured)).resolves.toBe(true);
    await expect(passes(instance(), replay)).resolves.toBe(false);
  });

  it("lets exactly one of concurrent deliveries through across instances", async () => {
    const one = instance();
    const two = instance();
    for (let round = 0; round < 10; round += 1) {
      // oxlint-disable-next-line no-await-in-loop -- each round signs its own request id
      const original = await forwarded(`req-race-${round}`);
      const copies = [original, ...Array.from({ length: 5 }, () => original.clone())];
      // oxlint-disable-next-line no-await-in-loop -- each round races its own deliveries; rounds run one after another
      const answers = await Promise.all(
        copies.map((copy, n) => passes(n % 2 === 0 ? one : two, copy)),
      );
      expect(answers.filter(Boolean)).toHaveLength(1);
    }
  });

  it("frees a request id once its claim's row has expired", async () => {
    const one = instance();
    const first = await forwarded("req-expired");
    const later = first.clone();
    await expect(passes(one, first)).resolves.toBe(true);
    clock.shift = (one.maxAge * 2 + 1) * 1000;
    try {
      await expect(passes(instance(), later)).resolves.toBe(true);
    } finally {
      clock.shift = 0;
    }
  });
});
