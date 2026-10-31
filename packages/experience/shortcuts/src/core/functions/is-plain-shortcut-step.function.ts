/**
 * Stackra file contract:
 * Purpose: `isPlainShortcutStep`: whether a normal-form step holds no command modifier
 *          (`mod`, `ctrl`, `alt`, `meta`), so typing would press it (the typing guard skips these in text fields,
 *          except Escape and the function keys).
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (typing guard, single-key off).
 */

/** The modifiers that make a step a command rather than typing. */
const COMMAND = new Set(["mod", "ctrl", "alt", "meta"]);

/**
 * Whether typing in a text field would press `step`.
 *
 * @example
 * isPlainShortcutStep("e"); // true
 * isPlainShortcutStep("escape"); // false
 */
export function isPlainShortcutStep(step: string): boolean {
  const parts = step.split("+");
  const key = parts.at(-1) ?? "";
  if (key === "escape" || /^f\d+$/.test(key)) return false;
  return !parts.slice(0, -1).some((modifier) => COMMAND.has(modifier));
}
