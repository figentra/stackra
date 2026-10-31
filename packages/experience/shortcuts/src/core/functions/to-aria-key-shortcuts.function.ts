/**
 * Stackra file contract:
 * Purpose: `toAriaKeyShortcuts`, the `aria-keyshortcuts` value of a binding on one platform (`Meta+K` on a Mac,
 *          `Control+Shift+L` elsewhere), or `undefined` for a chord, which the attribute cannot express.
 * Boundary: pure; key names are the `KeyboardEvent.key` values WAI-ARIA asks for.
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (`aria-keyshortcuts`); WAI-ARIA 1.2 `aria-keyshortcuts`.
 */
import { KEY_NAMES } from "#core/constants/key-names.constant";
import { normalizeShortcutKeys } from "#core/functions/normalize-shortcut-keys.function";
import { resolveShortcutStep } from "#core/functions/resolve-shortcut-step.function";

/**
 * The attribute value of `keys`.
 *
 * @example
 * toAriaKeyShortcuts("mod+k", true); // "Meta+K"
 * toAriaKeyShortcuts("g s", false); // undefined
 */
export function toAriaKeyShortcuts(keys: string, apple: boolean): string | undefined {
  const steps = normalizeShortcutKeys(keys);
  if (steps.length !== 1) return undefined;
  return resolveShortcutStep(steps[0] ?? "", apple)
    .split("+")
    .map((name) => (name === "space" ? "Space" : (KEY_NAMES[name]?.hotkey ?? name.toUpperCase())))
    .join("+");
}
