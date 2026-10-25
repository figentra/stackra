/**
 * Stackra file contract:
 * Purpose: `ShortcutTestingContribution`, what one testing part gives a `runShortcut` call: the shortcut instance
 *          (from the part that holds the member's container) and the context members it fakes.
 * Boundary: a type only. The first part that returns an instance wins; members are merged in registration order, a
 *           later part winning a member both supply. Every member is both passed to `run(ctx)` and returned on the
 *           result, so a test asserts on the fake the shortcut changed.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import type { RunnableShortcut } from "#core/index";

/** One part's share of a test run. */
export interface ShortcutTestingContribution {
  /** The shortcut built with its dependencies; omitted by a part that only fakes context members. */
  readonly shortcut?: RunnableShortcut;

  /** Context and result members (`theme`, `navigate`, `stores`, `navigations`). */
  readonly context?: Readonly<Record<string, unknown>>;
}
