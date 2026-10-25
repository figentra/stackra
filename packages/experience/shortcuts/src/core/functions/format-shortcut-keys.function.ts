/**
 * Stackra file contract:
 * Purpose: `formatShortcutKeys`, which turns a binding into what the key hint draws and says on one platform: the
 *          Apple glyphs run together (`⌘⇧L`), elsewhere the names joined by `+` (`Ctrl+Shift+L`).
 * Boundary: pure; the platform is the caller's (`isApplePlatform`), so a server render and a test pick it. Never
 *           returns the raw binding.
 * Runtime: isomorphic
 * Governing contract: registry v3.1 R-66 (display is ours); the template's shortcuts README (⌘ on Apple devices, Ctrl
 *                     elsewhere).
 */
import { KEY_NAMES } from "#core/constants/key-names.constant";
import { normalizeShortcutKeys } from "#core/functions/normalize-shortcut-keys.function";
import type { ShortcutKeysDisplay } from "#core/types/shortcut-keys-display.type";

/**
 * The drawn and spoken forms of `keys`.
 *
 * @throws RangeError when `keys` is not a key binding.
 * @example
 * formatShortcutKeys("mod+shift+l", true); // { steps: ["⌘⇧L"], spoken: "Command Shift L" }
 * formatShortcutKeys("g s", false); // { steps: ["G", "S"], spoken: "G, then S" }
 */
export function formatShortcutKeys(keys: string, apple: boolean): ShortcutKeysDisplay {
  const steps = normalizeShortcutKeys(keys).map((step) =>
    step.split("+").map((name) => {
      const named = KEY_NAMES[name];
      if (named === undefined) return { text: name.toUpperCase(), words: name.toUpperCase() };
      return apple
        ? { text: named.apple, words: named.appleWords }
        : { text: named.other, words: named.otherWords };
    }),
  );
  return {
    steps: steps.map((parts) => parts.map((part) => part.text).join(apple ? "" : "+")),
    spoken: steps.map((parts) => parts.map((part) => part.words).join(" ")).join(", then "),
  };
}
