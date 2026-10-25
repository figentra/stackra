/**
 * Stackra file contract:
 * Purpose: `useScope()`, the hook a header, a breadcrumb or a scope switcher reads the active scope with,
 *          re-rendering when it changes.
 * Boundary: reads the `ActiveScopeService` of the nearest container through `useSyncExternalStore`; a server render and
 *           a hydrating client start from `null`, so hydration never mismatches. Touches no platform API, so the same
 *           hook serves the web and native runtimes, and switching is `ActiveScopeService.set`. Throws outside a
 *           `ContainerProvider` or when the container does not bind the service.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decision 10); ADR 0079 (client state); ADR 0294 (decision 17); ADR 0295 (decision 10).
 */
import { useContainer } from "@stackra/container/react";
import type { ScopeRef } from "@stackra/contracts";
import { useSyncExternalStore } from "react";

import { ActiveScopeService } from "#core/index";

/** What a server render and a hydrating client read. */
const NO_SCOPE = (): null => null;

/**
 * The active scope, or `null` before one is chosen.
 *
 * @throws Error outside a `ContainerProvider`, or when the container does not bind `ActiveScopeService`.
 * @example
 * const scope = useScope();
 * return <Breadcrumb path={scope?.path ?? ""} />;
 */
export function useScope(): ScopeRef | null {
  const service = useContainer().get(ActiveScopeService);
  return useSyncExternalStore(service.subscribe, service.current, NO_SCOPE);
}
