/**
 * Stackra file contract:
 * Purpose: `ShortcutRunInput`, what a test hands `runShortcut`: the starting state of any context member, each one
 *          partial (`{ theme: { scheme: ColorScheme.Light } }`).
 * Boundary: a type only, derived from `ShortcutContext`, so it grows with every package that contributes a member.
 *           A testing part turns its member's input into a fake; a member no part claims is passed to the run as given.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); the template's shortcut tests.
 */
import type { ShortcutContext } from "#core/index";

/** Partial starting state for the context members of one test run. */
export type ShortcutRunInput = {
  readonly [Member in keyof ShortcutContext]?: Partial<ShortcutContext[Member]>;
};
