/**
 * Stackra file contract:
 * Purpose: unit and type tests of `QueryOptions` and its shipped schema `QUERY_CONFIG_SCHEMA`: the initializers equal
 *          the schema's defaults, the schema is registered for the shape, out-of-range numbers, an unknown scope and an
 *          unknown leader driver are refused, and the leader field is typed by the port's names.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 4 and 26); ADR 0059; ADR 0252.
 */
import type { DriverName } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import type { QueueLeader } from "#contracts/ports/queue-leader.port";
import { QUERY_CONFIG_SCHEMA } from "#core/constants/query-config-schema.constant";
import { QueryScope } from "#core/enums/query-scope.enum";
import { QueryOptions } from "#core/schemas/query-options.schema";

describe("QueryOptions", () => {
  it("has the schema's defaults as its initializers", () => {
    expect({ ...new QueryOptions() }).toEqual(QUERY_CONFIG_SCHEMA.parse({}));
    expect(QUERY_CONFIG_SCHEMA.parse({})).toEqual({
      scope: QueryScope.ActiveScope,
      persistEncrypted: true,
      persistMaxAgeHours: 24,
      replayOnReconnect: true,
      queueLeader: "memory",
      maxParallelAggregates: 4,
      queueRetentionDays: 7,
      staleTimeSeconds: 0,
      refetchOnFocus: true,
      retry: 3,
    });
  });

  it("registers the shipped schema for itself", () => {
    expect(schemaOf(QueryOptions)).toBe(QUERY_CONFIG_SCHEMA);
  });

  it("refuses numbers out of range", () => {
    for (const values of [
      { maxParallelAggregates: 0 },
      { queueRetentionDays: 0 },
      { persistMaxAgeHours: -1 },
      { staleTimeSeconds: 1.5 },
      { retry: 11 },
    ])
      expect(QUERY_CONFIG_SCHEMA.safeParse(values).success).toBe(false);
  });

  it("refuses an unknown scope or leader driver", () => {
    expect(QUERY_CONFIG_SCHEMA.safeParse({ scope: "tenant" }).success).toBe(false);
    expect(QUERY_CONFIG_SCHEMA.safeParse({ queueLeader: "redis" }).success).toBe(false);
    expect(QUERY_CONFIG_SCHEMA.parse({ scope: QueryScope.Principal }).scope).toBe("principal");
  });

  it("types the leader field by the port's driver names", () => {
    expectTypeOf<QueryOptions["queueLeader"]>().toEqualTypeOf<DriverName<QueueLeader>>();
    expectTypeOf<DriverName<QueueLeader>>().toEqualTypeOf<"broadcast_channel" | "memory">();
  });
});
