/**
 * Stackra file contract:
 * Purpose: `createShortcutContext`, which builds the context of one shortcut run by reading every contributed part.
 * Boundary: internal; called by `./react` right before `run(ctx)`. A member no package contributed is absent, so a
 *           shortcut that needs it fails at its first use of it, naming the member.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 17 and 23).
 */
import { SHORTCUT_CONTEXT_PARTS } from "#core/constants/shortcut-context-parts.constant";
import type { ShortcutContext } from "#core/types/shortcut-context.type";

/**
 * The context for a run starting now.
 *
 * @example
 * await shortcut.run(createShortcutContext());
 */
export function createShortcutContext(): ShortcutContext {
  const context: Record<string, unknown> = {};
  for (const part of SHORTCUT_CONTEXT_PARTS) Object.assign(context, part());
  return context as ShortcutContext;
}
