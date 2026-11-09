/**
 * Stackra file contract:
 * Purpose: `GET_PLAN_SNAPSHOT_QUERY`, the descriptor of the plan service's `entitlements.effective_set.snapshot.get@1`
 *          (`GET /snapshots/current`): the effective plan of the call's own scope, with how long it may be cached.
 * Boundary: internal to the package, used by TransportPlanServiceChannelDriver; the same descriptor gen writes into a
 *           host's `#stackra/clients/entitlements` from the plan service's manifest. Only the fields of
 *           `PlanSnapshotWire` are decoded; the rest of the answer is dropped. A change to it is a new query version.
 * Runtime: isomorphic
 * Governing contract: ADR 0215 (decision 5: consumers read the plan service's snapshot); ADR 0260 (decisions 3, 4 and
 *                     6).
 */
import { remoteQuery } from "#core/functions/remote-query.function";
import { HttpMethod } from "@stackra/contracts";
import { z } from "zod";

/**
 * The remote query `entitlements.effective_set.snapshot.get@1`.
 *
 * @example
 * await transport.send(clientRequest(GET_PLAN_SNAPSHOT_QUERY, {}));
 */
export const GET_PLAN_SNAPSHOT_QUERY = remoteQuery("entitlements.effective_set.snapshot.get@1", {
  input: z.object({}),
  output: z.object({
    version: z.number().int().min(0),
    maxAgeSeconds: z.number().int().min(0),
    scopeId: z.string().nullable(),
    grants: z.record(z.string(), z.unknown()),
    seats: z.record(z.string(), z.unknown()),
    paidSince: z.string().nullable(),
  }),
  endpoint: { method: HttpMethod.Get, path: "/snapshots/current" },
});
