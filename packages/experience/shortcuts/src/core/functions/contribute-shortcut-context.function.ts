/**
 * Stackra file contract:
 * Purpose: `contributeShortcutContext`, how a package supplies the members it adds to `ShortcutContext`: navigation
 *          its `navigate`, theming its `theme`, identity its `identity`.
 * Boundary: writes `SHORTCUT_CONTEXT_PARTS`; returns the disposer that removes the part again (a React effect's
 *           cleanup, a module's shutdown). Parts are merged in contribution order, so a later part wins a member both
 *           supply.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 17 and 23).
 */
import { SHORTCUT_CONTEXT_PARTS } from "#core/constants/shortcut-context-parts.constant";
import type { ShortcutContextPart } from "#core/types/shortcut-context-part.type";

/**
 * Adds `part` to every shortcut run's context until the returned disposer is called.
 *
 * @example
 * useEffect(() => contributeShortcutContext(() => ({ navigate })), [navigate]);
 */
export function contributeShortcutContext(part: ShortcutContextPart): () => void {
  // a wrapper, so contributing one function twice gives two parts with their own disposers
  const own: ShortcutContextPart = () => part();
  SHORTCUT_CONTEXT_PARTS.add(own);
  return () => {
    SHORTCUT_CONTEXT_PARTS.delete(own);
  };
}
