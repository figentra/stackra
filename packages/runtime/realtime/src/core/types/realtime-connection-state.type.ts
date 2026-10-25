/**
 * Stackra file contract:
 * Purpose: `RealtimeConnectionState`, what `useRealtimeConnection()` returns while signed in: the connection's status.
 * Boundary: a type only. `RealtimeConnection` replaces the frozen object on each change, so a React snapshot compares
 *           by identity; signed out there is no state (`null`).
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1); ADR 0295 (decision 10: the realtime context).
 */
import type { RealtimeStatus } from "#core/enums/realtime-status.enum";

/** The client connection as a component sees it. */
export interface RealtimeConnectionState {
  /** Live, connecting or down. */
  readonly status: RealtimeStatus;
}
