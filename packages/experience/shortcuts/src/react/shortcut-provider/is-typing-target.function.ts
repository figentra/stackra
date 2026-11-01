/**
 * Stackra file contract:
 * Purpose: `isTypingTarget`, whether a key press lands where it types text (a text input, a text area, a select, an
 *          editable element), so a shortcut without a command modifier must not fire there.
 * Boundary: pure DOM read; a checkbox, radio, button or range input is not a typing target.
 * Runtime: browser
 * Governing contract: ADR 0508 (typing guard).
 */

/** Input types that do not take text. */
const NOT_TEXT = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

/**
 * Whether typing at `target` writes text.
 *
 * @example
 * isTypingTarget(document.querySelector("input[type=search]")); // true
 */
export function isTypingTarget(target: unknown): boolean {
  if (typeof HTMLElement === "undefined" || !(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  return target instanceof HTMLInputElement && !NOT_TEXT.has(target.type);
}
