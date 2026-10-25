/**
 * Stackra file contract:
 * Purpose: `RouteLoaderRun`, the extra members a test reads after a route helper (`runRouteLoader` besides `result`,
 *          `renderRoute`): the fakes the run used (the tenancy switcher it called, the navigations it recorded).
 * Boundary: a type only, and open: this package declares no member. The package whose testing part supplies one adds
 *           it by declaration merging (`declare module "@stackra/navigation/testing" { interface RouteLoaderRun { ... } }`).
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); the template's layout tests (`{ result, tenancy }`).
 */

/**
 * What testing parts add to the result of `runRouteLoader`.
 *
 * @example
 * declare module "@stackra/navigation/testing" {
 *   interface RouteLoaderRun {
 *     readonly tenancy: TenantSwitcherFake;
 *   }
 * }
 */
// oxlint-disable-next-line typescript/no-empty-interface, typescript/no-empty-object-type -- reason: open by design; testing parts add members by declaration merging
export interface RouteLoaderRun {}
