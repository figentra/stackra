/**
 * Stackra file contract:
 * Purpose: `SHORTCUT_CONTEXT_PARTS`, the contributed parts of the shortcut context, in contribution order.
 * Boundary: process state written only by `contributeShortcutContext` and its disposers; read by
 *           `createShortcutContext`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 17 and 23).
 */
import type { ShortcutContextPart } from "#core/types/shortcut-context-part.type";

/** The contributed parts. */
export const SHORTCUT_CONTEXT_PARTS = new Set<ShortcutContextPart>();
