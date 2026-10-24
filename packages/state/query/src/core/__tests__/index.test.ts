/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/query`
 *          (`QueryConfig`, the generated `QueryConfig$`, `QueryScope`, `offlineMap`) and the registry row's queue,
 *          cache, persister and refusal are exported, nothing else is, the `$` name is the shipped schema, the ports
 *          and the record types stay in their own entries, and the public types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { QUERY_CONFIG_SCHEMA } from "#core/constants/query-config-schema.constant";
import * as query from "#core/index";
import type {
  LiveQueryRef,
  OfflineActionRef,
  OfflineEntry,
  OfflineMap,
  QueryPartition,
  QueryPersisterName,
  QueueLeaderName,
} from "#core/index";

describe("@stackra/query", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(query).sort()).toEqual([
      "MutationQueue",
      "OfflineError",
      "QueryConfig",
      "QueryConfig$",
      "QueryOptions",
      "QueryScope",
      "ServerStateCache",
      "StorageQueryPersisterDriver",
      "offlineMap",
    ]);
  });

  it("exports the shipped schema under its generated name", () => {
    expect(query.QueryConfig$).toBe(QUERY_CONFIG_SCHEMA);
  });

  it("resolves its public types", () => {
    expectTypeOf<QueryPersisterName>().toEqualTypeOf<"storage">();
    expectTypeOf<QueueLeaderName>().toEqualTypeOf<"broadcast_channel" | "memory">();
    expectTypeOf<OfflineActionRef["key"]>().toEqualTypeOf<string>();
    expectTypeOf<OfflineEntry["action"]>().toEqualTypeOf<OfflineActionRef>();
    expectTypeOf<ReturnType<OfflineMap["for"]>>().toEqualTypeOf<OfflineEntry | undefined>();
    expectTypeOf<LiveQueryRef["key"]>().toEqualTypeOf<string>();
    expectTypeOf<keyof QueryPartition>().toEqualTypeOf<"principal" | "scope">();
  });
});
