/**
 * Stackra file contract:
 * Purpose: `ShortcutRun`, the extra members a test reads after `runShortcut` besides the context and the instance: the
 *          stores the run changed, the router it moved, the navigations it recorded.
 * Boundary: a type only, and open: this package declares no member. The package whose testing part supplies one adds
 *           it by declaration merging (`declare module "@stackra/shortcuts/testing" { interface ShortcutRun { ... } }`).
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); the template's shortcut tests (`stores`, `router`, `navigations`).
 */

/**
 * What testing parts add to the result of `runShortcut`.
 *
 * @example
 * declare module "@stackra/shortcuts/testing" {
 *   interface ShortcutRun {
 *     readonly navigations: readonly { to: string; external?: boolean }[];
 *   }
 * }
 */
// oxlint-disable-next-line typescript/no-empty-interface, typescript/no-empty-object-type -- reason: open by design; testing parts add members by declaration merging
export interface ShortcutRun {}
