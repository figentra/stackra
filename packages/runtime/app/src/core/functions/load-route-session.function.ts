/**
 * Stackra file contract:
 * Purpose: `loadRouteSession(container)`, run by the Worker, browser and native `createApp` before routes read their
 *          context: it loads the session from the container's `SessionStore` once and keeps it for `routeSessionPart`.
 * Boundary: internal. No `SessionStore` bound means signed out. A refusal from the store (a revoked or expired
 *           session) means signed out too, so the layout sends the visitor to sign in; any other error rejects and
 *           the target reports it.
 * Runtime: isomorphic
 * Governing contract: ADR 0457 (session and identity on RouteServices); ADR 0206 (decision 8).
 */
import type { Container } from "@stackra/container";
import { isRefusal } from "@stackra/errors";
import { SessionStore } from "@stackra/identity/contracts";
import type { SessionUser } from "@stackra/identity/contracts";

import { ROUTE_SESSIONS } from "#core/constants/route-sessions.constant";

/**
 * Loads and keeps the session of `container`.
 *
 * @throws Error (as a rejection) when the store fails with anything but a refusal.
 * @example
 * const container = booted.container.forRequest();
 * await loadRouteSession(container);
 */
export async function loadRouteSession(container: Container): Promise<void> {
  let user: SessionUser | null = null;
  if (container.has(SessionStore))
    try {
      user = await container.get(SessionStore).load();
    } catch (error) {
      if (!isRefusal(error)) throw error;
    }
  ROUTE_SESSIONS.set(container, user);
}
