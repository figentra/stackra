/**
 * Stackra file contract:
 * Purpose: `recordedShortcutStep`, the binding a key recorder writes for a key press: the physical key's step with the
 *          platform's command modifier written `mod` (`meta+k` on a Mac and `ctrl+k` elsewhere both record `mod+k`),
 *          so a remap made on one platform works on the other; `undefined` for a bare modifier.
 * Boundary: pure; reads @stackra/shortcuts' `shortcutStepOf`.
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (remap with a key recorder).
 */
import { normalizeShortcutKeys, shortcutStepOf, type ShortcutKeyEvent } from "@stackra/shortcuts";

/**
 * The recorded binding of a press.
 *
 * @example
 * recordedShortcutStep({ code: "KeyK", key: "k", metaKey: true, ctrlKey: false, altKey: false, shiftKey: false }, true); // "mod+k"
 */
export function recordedShortcutStep(event: ShortcutKeyEvent, apple: boolean): string | undefined {
  const step = shortcutStepOf(event);
  if (step === undefined) return undefined;
  const command = apple ? "meta" : "ctrl";
  const parts = step
    .split("+")
    .map((part, index, all) => (index < all.length - 1 && part === command ? "mod" : part));
  return normalizeShortcutKeys(parts.join("+")).join(" ");
}
