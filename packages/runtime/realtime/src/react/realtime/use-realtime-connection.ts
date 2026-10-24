/**
 * Stackra file contract:
 * Purpose: `useRealtimeConnection()`, the hook a component reads the client realtime connection with: its state
 *          (`{ status }`) while signed in, `null` while signed out, re-rendering on each change.
 * Boundary: reads the `RealtimeConnection` of the nearest container through `useSyncExternalStore`, so a render never
 *           sees a torn status and the server render reads the same snapshot. Throws outside a `ContainerProvider` or
 *           when the container does not bind `RealtimeConnection`. It never connects or reconnects: the realtime
 *           context and the connection do.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1); ADR 0294 (decision 17); ADR 0295 (decision 10).
 */
import { useContainer } from "@stackra/container/react";
import { useSyncExternalStore } from "react";

import { RealtimeConnection } from "#core/index";
import type { RealtimeConnectionState } from "#core/index";

/**
 * The connection's state, or `null` while signed out.
 *
 * @throws Error outside a `ContainerProvider`, or when the container does not bind `RealtimeConnection`.
 * @example
 * const connection = useRealtimeConnection();
 * const live = connection?.status === RealtimeStatus.Connected;
 */
export function useRealtimeConnection(): RealtimeConnectionState | null {
  const connection = useContainer().get(RealtimeConnection);
  const read = (): RealtimeConnectionState | null => connection.state;
  return useSyncExternalStore(connection.subscribeState, read, read);
}
