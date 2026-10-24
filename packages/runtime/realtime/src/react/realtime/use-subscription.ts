/**
 * Stackra file contract:
 * Purpose: `useSubscription(Event, listener)`, the hook a component or a data hook refreshes with: it calls `listener`
 *          with each data-free refresh of the consumed event class (`OrderPaid`) while mounted.
 * Boundary: subscribes on the `RealtimeConnection` of the nearest container in an effect, so nothing runs during a
 *           server render, and unsubscribes on unmount or when the event class changes. The latest `listener` is
 *           called without resubscribing, so an inline arrow is fine. Takes the event class, never a channel string.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (broadcast); ADR 0294 (decision 17); ADR 0295 (decision 10).
 */
import { useContainer } from "@stackra/container/react";
import { useEffect, useEffectEvent } from "react";

import type { RealtimeMessage } from "#contracts/index";
import { RealtimeConnection } from "#core/index";
import type { RealtimeEventRef } from "#core/index";

/**
 * Calls `listener` on each refresh of `event` while the component is mounted.
 *
 * @throws Error outside a `ContainerProvider`, or when the container does not bind `RealtimeConnection`.
 * @example
 * useSubscription(OrderPaid, () => query.refetch());
 */
export function useSubscription<P extends object>(
  event: RealtimeEventRef<P>,
  listener: (message: RealtimeMessage) => void,
): void {
  const connection = useContainer().get(RealtimeConnection);
  const onMessage = useEffectEvent(listener);
  useEffect(
    () => connection.subscribe(event, (message) => onMessage(message)),
    [connection, event],
  );
}
