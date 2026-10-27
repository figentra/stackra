/**
 * Stackra file contract:
 * Purpose: `ROUTE_SESSIONS`, the session `loadRouteSession` loaded for a container (a Worker's request container, the
 *          browser's or the device's root container), read synchronously by `routeSessionPart`.
 * Boundary: internal, never exported. A `WeakMap` keyed by the container, so a request's session is dropped with its
 *           request container and never reaches another request.
 * Runtime: isomorphic
 * Governing contract: ADR 0457 (session and identity on RouteServices).
 */
import type { Container } from "@stackra/container";
import type { SessionUser } from "@stackra/identity/contracts";

/** The loaded session per container. */
export const ROUTE_SESSIONS = new WeakMap<Container, SessionUser | null>();
