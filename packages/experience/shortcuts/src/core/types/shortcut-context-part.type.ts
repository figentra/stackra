/**
 * Stackra file contract:
 * Purpose: `ShortcutContextPart`, what a contributing package hands `contributeShortcutContext`: a function that
 *          returns its members of `ShortcutContext`, read at the moment a shortcut runs.
 * Boundary: a type only. A function rather than a value, so a member that changes (the current router, the current
 *           scheme) is never stale.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 17 and 23).
 */
import type { ShortcutContext } from "#core/types/shortcut-context.type";

/** One package's members of the shortcut context, read per run. */
export type ShortcutContextPart = () => Partial<ShortcutContext>;
