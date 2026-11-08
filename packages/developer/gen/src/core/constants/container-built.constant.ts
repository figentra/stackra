/**
 * Stackra file contract:
 * Purpose: `CONTAINER_BUILT`, the classes `@stackra/container` builds and registers itself (`Container` and
 *          `DiscoveryService`), keyed `<package>#<Class>`: a member that injects one lists it among the wiring's
 *          `platform` classes, and gen never writes a binding for it (STA-2553).
 * Boundary: data only. `DiscoveryService` is a service in the container's own manifest, so without this list a host's
 *           wiring bound it with `deps: [Container]`, whose constructor is private (TS2322 in the host).
 * Runtime: isomorphic
 * Governing contract: ADR 0144 as amended by 0263 (the container builds DiscoveryService); STA-2553.
 */

/** The classes the container provides itself, never bound by the wiring. */
export const CONTAINER_BUILT: ReadonlySet<string> = new Set([
  "@stackra/container#Container",
  "@stackra/container#DiscoveryService",
]);
