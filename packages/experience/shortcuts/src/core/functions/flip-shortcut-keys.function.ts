/**
 * Stackra file contract:
 * Purpose: `flipShortcutKeys`, a binding with Left and Right swapped, for a next or previous action read right to
 *          left: `mod+right` (next) becomes `mod+left` in Arabic, so the arrow still points the way the page moves.
 * Boundary: pure; the binding is returned in normal form.
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (RTL flips next and previous arrows).
 */
import { normalizeShortcutKeys } from "#core/functions/normalize-shortcut-keys.function";

/** Left for Right and back. */
const FLIP: Readonly<Record<string, string>> = { left: "right", right: "left" };

/**
 * The mirrored binding.
 *
 * @example
 * flipShortcutKeys("mod+right"); // "mod+left"
 */
export function flipShortcutKeys(keys: string): string {
  return normalizeShortcutKeys(keys)
    .map((step) => {
      const parts = step.split("+");
      const key = parts.at(-1) ?? "";
      return [...parts.slice(0, -1), FLIP[key] ?? key].join("+");
    })
    .join(" ");
}
