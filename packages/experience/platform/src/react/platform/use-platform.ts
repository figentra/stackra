/**
 * Stackra file contract:
 * Purpose: `usePlatform()`, the hook a component or a hook reads the running target's capabilities with: `has(...)`
 *          and every facet (`platform.network.isOnline`, `platform.notifications.requestPermission()`).
 * Boundary: resolves the `Platform` port from the nearest container (`useContainer` throws outside a
 *           `ContainerProvider`, an unbound port throws `UnresolvedPortError`), so a missing driver is a boot or test
 *           failure. It does not re-render on its own; a live value is read with `useSignal`.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decisions 2 and 3); ADR 0294 (decision 17); ADR 0295 (decision 10).
 */
import { useContainer } from "@stackra/container/react";

import { Platform } from "#contracts/ports/platform.port";

/**
 * The container's `Platform`.
 *
 * @example
 * const platform = usePlatform();
 * const isOnline = useSignal(platform.network.isOnline);
 */
export function usePlatform(): Platform {
  return useContainer().get(Platform);
}
