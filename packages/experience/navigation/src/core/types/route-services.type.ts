/**
 * Stackra file contract:
 * Purpose: `RouteServices`, the request-scoped members other packages add to every `RouteContext`: the session and
 *          the identity flows (identity), the actor's permission check (iam), the device prefs (state), the member's
 *          typed env (gen).
 * Boundary: a type only, and open: this package declares no member. A package adds its member by declaration merging
 *           (`declare module "@stackra/navigation" { interface RouteServices { ... } }`) and supplies the value with
 *           `contributeRouteContext`, and in tests with `registerRouteTestingPart`. Dependencies a route always needs
 *           arrive through its constructor, never here.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16, 17 and 23).
 */

/**
 * The members contributed to every route context.
 *
 * @example
 * declare module "@stackra/navigation" {
 *   interface RouteServices {
 *     readonly session: Session | null;
 *   }
 * }
 */
// oxlint-disable-next-line typescript/no-empty-interface, typescript/no-empty-object-type -- reason: open by design; contributing packages add members by declaration merging
export interface RouteServices {}
