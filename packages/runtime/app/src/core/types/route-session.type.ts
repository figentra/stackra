/**
 * Stackra file contract:
 * Purpose: `RouteSession`, the two route context members this package adds to `@stackra/navigation`'s `RouteServices`:
 *          `session` (the signed-in user of this request, or null) and `identity` (the identity flows: sign in, sign
 *          out, the access token), so a layout's loader can gate on a session (`if (!ctx.session) return
 *          ctx.redirect(...)`).
 * Boundary: a type and a module augmentation only. The shapes are `@stackra/identity`'s contracts (`SessionUser`,
 *           `SessionStore`); the values come from `routeSessionPart`, which reads what `loadRouteSession` loaded for
 *           the route's container. Exported from `.` so the augmentation travels with the package's types.
 * Runtime: isomorphic
 * Governing contract: ADR 0457 (session and identity on RouteServices); ADR 0294 (decisions 17 and 23); ADR 0206.
 */
import type { SessionStore, SessionUser } from "@stackra/identity/contracts";
// oxlint-disable-next-line eslint/no-restricted-imports, unicorn/require-module-specifiers, import/no-empty-named-blocks -- reason: tsc adds an augmented module to a consumer's program only through an import, so a member compiling this source without one hit TS2664
import type {} from "@stackra/navigation";

/** The session members of every route context. */
export interface RouteSession {
  /** The signed-in user of this request; null when signed out, refused, or when the app binds no `SessionStore`. */
  readonly session: SessionUser | null;

  /** The identity flows of this app's `SessionStore` driver; undefined when the app binds none. */
  readonly identity: SessionStore | undefined;
}

declare module "@stackra/navigation" {
  // oxlint-disable-next-line typescript/no-empty-interface, typescript/no-empty-object-type -- reason: the augmentation adds RouteSession's members to the open RouteServices
  interface RouteServices extends RouteSession {}
}
