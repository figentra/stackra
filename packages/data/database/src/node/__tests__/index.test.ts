/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: the Postgres, unit-of-work, replica-reads, idempotency and
 *          rate-limit drivers, the service-backed hold registry, the migration runner, the seed runner, the direct URL
 *          reader, the health indicator and the primary connection resolver are exported, nothing else is.
 * Boundary: test only; no database is connected.
 * Runtime: node (vitest)
 * Governing contract: ADR 0294 (decision 15); ADR 0396; ADR 0022.
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/database/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual([
      "DatabaseHealthIndicatorDriver",
      "DatabaseReplicaReadsDriver",
      "DatabaseUnitOfWorkDriver",
      "PostgresDatabaseDriver",
      "PostgresIdempotencyStoreDriver",
      "PostgresRateLimitStoreDriver",
      "PrimaryConnectionResolverDriver",
      "ServiceHoldRegistryDriver",
      "applySeed",
      "directDatabaseUrl",
      "migrate",
      "rollback",
      "seedState",
    ]);
  });
});
