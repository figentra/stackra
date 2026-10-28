/**
 * Stackra file contract:
 * Purpose: `Matchers<R>`: the interface a domain package augments to type the matchers it registers with
 *          `createMatcher`, merged into vitest's assertion so `expect(x).toY()` type-checks.
 * Boundary: a public type of the `.` entry; empty here, filled only by augmentation in each owning package's
 *           `./testing` entry (ADR 0269 decision 3).
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (decisions 2 and 3).
 */

// Empty until a package adds a matcher; `Record<never, R>` adds no member but names `R`, which every merged
// declaration must repeat, so a program with no augmentation does not report it unused.
/**
 * Augment it beside the matcher: `declare module "@stackra/testing" { interface Matchers<R> { toY(arg: A): R } }`,
 * returning `Promise<R>` for an async matcher. `R` is what the assertion returns.
 */
// oxlint-disable-next-line typescript/no-empty-object-type, typescript/no-empty-interface -- empty until a package augments it with a matcher
export interface Matchers<R> extends Record<never, R> {}

/** Our `Matchers`, named apart so the vitest augmentation below can extend it. */
type StackraMatchers<R> = Matchers<R>;

declare module "vitest" {
  // The type parameters repeat vitest's own `Matchers` declaration exactly, as declaration merging requires.
  /* oxlint-disable typescript/no-empty-object-type, typescript/no-empty-interface, no-unused-vars, no-shadow -- merges with vitest's own Matchers, so it repeats its unused params and its name */
  interface Matchers<
    R extends void | Promise<void> = void | Promise<void>,
    T = unknown,
  > extends StackraMatchers<R> {}
  /* oxlint-enable typescript/no-empty-object-type, typescript/no-empty-interface, no-unused-vars, no-shadow */
}
