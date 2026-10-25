/**
 * Stackra file contract:
 * Purpose: `normalizeShortcutKeys`, which reads a key binding (`Shift+Mod+L`, `g  s`) into its steps in normal form
 *          (`["mod+shift+l"]`, `["g", "s"]`): lower case, modifiers in `MODIFIERS` order, one key last.
 * Boundary: pure. Refuses anything that is not a binding, so a typo fails where the shortcut is declared, not when
 *           nobody can press it. A step is modifiers and exactly one key joined by `+`; steps of a chord are separated
 *           by spaces. `mod` stands for Command or Control, so it is refused beside `meta` or `ctrl`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 23); registry v3.1 final review H (chord sequences).
 */
import { KEY_NAMES } from "#core/constants/key-names.constant";
import { MODIFIERS } from "#core/constants/modifiers.constant";

/** The single printable characters a binding may use as its key. */
const CHARACTER = /^[a-z0-9`\-=[\];',./\\]$/;

/** Whether `name` is a key a step may end with (not a modifier). */
const isKey = (name: string): boolean =>
  !MODIFIERS.includes(name) && (CHARACTER.test(name) || Object.hasOwn(KEY_NAMES, name));

/**
 * The steps of `keys` in normal form.
 *
 * @throws RangeError when `keys` is empty, a step has no key or two, a modifier is unknown or repeated, or `mod` sits
 *         beside the modifier it stands for.
 * @example
 * normalizeShortcutKeys("Shift+Mod+L"); // ["mod+shift+l"]
 * normalizeShortcutKeys("g s"); // ["g", "s"]
 */
export function normalizeShortcutKeys(keys: string): readonly string[] {
  const text = keys.trim().toLowerCase();
  if (text === "") throw new RangeError("A shortcut's keys are empty");
  return text.split(/\s+/).map((step) => {
    const parts = step.split("+");
    const key = parts.at(-1) ?? "";
    const modifiers = parts.slice(0, -1);
    if (!isKey(key)) throw new RangeError(`"${step}" in "${keys}" does not end with one key`);
    for (const [index, modifier] of modifiers.entries()) {
      if (!MODIFIERS.includes(modifier))
        throw new RangeError(`"${modifier}" in "${keys}" is not a modifier`);
      if (modifiers.indexOf(modifier) !== index)
        throw new RangeError(`"${modifier}" is repeated in "${keys}"`);
    }
    if (modifiers.includes("mod") && (modifiers.includes("ctrl") || modifiers.includes("meta")))
      throw new RangeError(`"${keys}" pairs mod with the modifier it stands for`);
    return [...MODIFIERS.filter((modifier) => modifiers.includes(modifier)), key].join("+");
  });
}
