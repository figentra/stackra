/**
 * Stackra file contract:
 * Purpose: `useTenant()`, the hook a page, a header or a switcher reads the active membership with, re-rendering when
 *          it changes; `useTenant({ optional: true })` for a view that also renders without one.
 * Boundary: reads the `TenantSwitcher` of the nearest container through `useSyncExternalStore`. The server snapshot is
 *           the switcher's own state, so a page that needs a tenant renders on the server once the session set the
 *           memberships there. Touches no platform API, so web and native share it. Throws outside a
 *           `ContainerProvider`, when the container does not bind the switcher, or (without `optional`) with no active
 *           tenant.
 * Runtime: isomorphic
 * Governing contract: ADR 0210 (decision 3: one tenant context); ADR 0208 (memberships); ADR 0294 (decision 17); ADR
 *                     0295 (decision 10).
 */
import { useContainer } from "@stackra/container/react";
import { useSyncExternalStore } from "react";

import { TenantRequiredError, TenantSwitcher } from "#core/index";
import type { TenantMembership } from "#core/types/tenant-membership.type";

/**
 * The active membership.
 *
 * @throws TenantRequiredError when no tenant is active.
 * @throws Error outside a `ContainerProvider`, or when the container does not bind `TenantSwitcher`.
 * @example
 * const tenant = useTenant();
 * return <Title>{tenant.name}</Title>;
 */
export function useTenant(): TenantMembership;
/**
 * The active membership, or `null` when none is active.
 *
 * @example
 * const current = useTenant({ optional: true });
 */
export function useTenant(options: { readonly optional: true }): TenantMembership | null;
/** The implementation behind both overloads: reads the switcher and throws when a required tenant is missing. */
export function useTenant(options?: { readonly optional?: boolean }): TenantMembership | null {
  const switcher = useContainer().get(TenantSwitcher);
  const current = useSyncExternalStore(switcher.subscribe, switcher.current, switcher.current);
  if (current === null && options?.optional !== true) throw TenantRequiredError.create();
  return current;
}
