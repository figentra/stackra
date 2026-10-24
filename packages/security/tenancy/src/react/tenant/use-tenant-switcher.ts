/**
 * Stackra file contract:
 * Purpose: `useTenantSwitcher()`, the hook a tenant switcher lists the memberships and switches with, re-rendering
 *          when the memberships change.
 * Boundary: reads the `TenantSwitcher` of the nearest container through `useSyncExternalStore`; `switchTo` is the
 *           switcher's own, stable across renders. A switch is refused (`TenantMembershipMissingError`) for a tenant the
 *           user is not a member of; an app's own rule, such as waiting for queued writes, wraps it. Web and native
 *           share it. Throws outside a `ContainerProvider` or when the container does not bind the switcher.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (memberships); ADR 0327 (decision 10: the switcher); ADR 0294 (decision 17).
 */
import { useContainer } from "@stackra/container/react";
import { useSyncExternalStore } from "react";

import { TenantSwitcher } from "#core/index";
import type { TenantMembership } from "#core/types/tenant-membership.type";

/**
 * The memberships and the switch.
 *
 * @throws Error outside a `ContainerProvider`, or when the container does not bind `TenantSwitcher`.
 * @example
 * const { memberships, switchTo } = useTenantSwitcher();
 * await switchTo(memberships[1].tenantId);
 */
export function useTenantSwitcher(): {
  readonly memberships: readonly TenantMembership[];
  readonly switchTo: (tenantId: string) => Promise<void>;
} {
  const switcher = useContainer().get(TenantSwitcher);
  const memberships = useSyncExternalStore(
    switcher.subscribe,
    switcher.memberships,
    switcher.memberships,
  );
  return { memberships, switchTo: switcher.switchTo };
}
