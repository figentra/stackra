/**
 * Stackra file contract:
 * Purpose: `QUERY_CONFIG_SCHEMA`, the zod schema this package ships for `QueryConfig` (exported as `QueryConfig$`):
 *          the key scope, the persisted cache (encryption, age), the queue (replay on reconnect, leader driver,
 *          parallel aggregates, retention) and the read defaults (fresh time, refetch on focus, retries).
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults and a host's generated `QueryConfig$` extends it. The defaults equal `QueryOptions`'
 *           initializers (tested). The leader names are the `QueueLeader` drivers. No object-level refinement, so gen's
 *           `.extend(...)` stays possible.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0059; ADR 0252.
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { QueryScope } from "#core/enums/query-scope.enum";

// shortcut: authored until gen compiles this package's QueryOptions into #stackra/schemas; replace with STA-339.
/** The shipped `QueryConfig$`. */
export const QUERY_CONFIG_SCHEMA = z.object({
  scope: z.enum(Enum.values(QueryScope)).default(QueryScope.ActiveScope),
  persistEncrypted: z.boolean().default(true),
  persistMaxAgeHours: z.number().int().min(0).max(720).default(24),
  replayOnReconnect: z.boolean().default(true),
  queueLeader: z.enum(["broadcast_channel", "memory"]).default("memory"),
  maxParallelAggregates: z.number().int().min(1).max(32).default(4),
  queueRetentionDays: z.number().int().min(1).max(90).default(7),
  staleTimeSeconds: z.number().int().min(0).default(0),
  refetchOnFocus: z.boolean().default(true),
  retry: z.number().int().min(0).max(10).default(3),
});
