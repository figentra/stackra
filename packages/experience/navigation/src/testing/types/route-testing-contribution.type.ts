/**
 * Stackra file contract:
 * Purpose: `RouteTestingContribution`, what one testing part gives a `runLoader` call: the route or layout instance
 *          (from the part that holds the member's container) and the context members it fakes.
 * Boundary: a type only. The first part that returns an instance wins; members are merged in registration order, a
 *           later part winning a member both supply. Every member is both in the context and on the result, so a test
 *           asserts on the fake the loader changed.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */

/** One part's share of a loader run. */
export interface RouteTestingContribution {
  /** The route or layout built with its dependencies; omitted by a part that only fakes members. */
  readonly instance?: object;

  /** Context and result members (`session`, `tenancy`, `navigations`). */
  readonly context?: Readonly<Record<string, unknown>>;
}
