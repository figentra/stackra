/**
 * Stackra file contract:
 * Purpose: `effectiveShortcutKeys`, the binding an action answers to now: the person's or tenant's remap of its id when
 *          there is one (`null` unbinds it), else its own; mirrored for a directional action on a right-to-left page;
 *          `undefined` when it has none or the binding does not parse (an old display string such as `⌘E`).
 * Boundary: pure; the binding is returned in normal form.
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (remaps, RTL flip).
 */
import { flipShortcutKeys } from "#core/functions/flip-shortcut-keys.function";
import { normalizeShortcutKeys } from "#core/functions/normalize-shortcut-keys.function";
import type { ShortcutSettings } from "#core/types/shortcut-settings.type";

/**
 * The binding in force.
 *
 * @example
 * effectiveShortcutKeys({ id: "x", shortcut: "mod+right", isDirectional: true }, settings, true); // "mod+left"
 */
export function effectiveShortcutKeys(
  action: {
    readonly id: string;
    readonly shortcut?: string | undefined;
    readonly isDirectional?: boolean | undefined;
  },
  settings: Pick<ShortcutSettings, "remaps">,
  rtl: boolean,
): string | undefined {
  const remap = settings.remaps[action.id];
  const keys = remap === undefined ? action.shortcut : (remap ?? undefined);
  if (keys === undefined) return undefined;
  try {
    const normal = normalizeShortcutKeys(keys).join(" ");
    return action.isDirectional && rtl ? flipShortcutKeys(normal) : normal;
  } catch {
    return undefined;
  }
}
