/**
 * Stackra file contract:
 * Purpose: `LiveQueryRefresh`, what `liveQueryRoutes` needs of one live query (a query that declares
 *          `cache.invalidateOn`, every `replica:` query among them): the events that invalidate it, the permission a
 *          session needs to read it, and who hears its refresh.
 * Boundary: a type only, filled by gen from the committed manifest's query entry: the permission is the resolved name,
 *           the events are the generated event classes (read by their static `eventName`), never wire strings.
 * Runtime: isomorphic
 * Governing contract: ADR 0315 (decision 1: live queries; tenant and principal channels); ADR 0338 (decision 3: the
 *                     replica refresh signal).
 */
import type { BroadcastAudience } from "@stackra/events";

import type { RealtimeEventRef } from "#core/types/realtime-event-ref.type";

/** The refresh facts of one live query. */
export interface LiveQueryRefresh {
  /** The query's permission (`sales.sale.read`); a session hears the refresh only when it holds it. */
  readonly permission: string;

  /** `Tenant` for rows the tenant shares (a replica of recent sales), `Principal` for the caller's own. */
  readonly audience: BroadcastAudience;

  /** The events its `cache.invalidateOn` names. */
  readonly invalidateOn: readonly RealtimeEventRef[];
}
