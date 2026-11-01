/**
 * Stackra file contract:
 * Purpose: `isCharacterShortcutStep`, whether a normal-form step is one character key, Shift allowed (`e`, `/`,
 *          `shift+/`): the shortcuts a person can turn off (WCAG 2.2 SC 2.1.4).
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (single-key off).
 */

/**
 * Whether `step` is a single character key, with Shift at most.
 *
 * @example
 * isCharacterShortcutStep("shift+/"); // true
 * isCharacterShortcutStep("left"); // false
 */
export function isCharacterShortcutStep(step: string): boolean {
  const parts = step.split("+");
  const key = parts.at(-1) ?? "";
  return (
    (key.length === 1 || key === "space") &&
    parts.slice(0, -1).every((modifier) => modifier === "shift")
  );
}
