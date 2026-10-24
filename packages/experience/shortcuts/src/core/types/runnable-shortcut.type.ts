/**
 * Stackra file contract:
 * Purpose: `RunnableShortcut`, a shortcut instance with its `run(ctx)`: what the hooks, the bindings and `runShortcut`
 *          accept, so a class without `run` is a type error where it is used.
 * Boundary: a type only. `run` is not on the kind base (an author would otherwise have to write `override run`); this
 *           type states it once for every runner. A `run` that takes no context fits too.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 23 and 25; R3: `override` only on members that replace a default).
 */
import type { Shortcut } from "#core/bases/shortcut.base";
import type { ShortcutContext } from "#core/types/shortcut-context.type";

/** A shortcut that can be run. */
export type RunnableShortcut = Shortcut & {
  /** Does what the shortcut is for, with the context of this run. */
  run(ctx: ShortcutContext): void | Promise<void>;
};
