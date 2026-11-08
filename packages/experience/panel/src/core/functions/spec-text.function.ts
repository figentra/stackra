/**
 * Stackra file contract:
 * Purpose: `specText(text, t)`, the words of a spec's text field: an i18n key (`<namespace>::<path>`) through the
 *          translator, anything else as written.
 * Boundary: internal; pure but for `t`. Gen writes derived keys, an author may write either; a key's missing message
 *           throws as `t` does. Web and native renderers share it.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0504 (decision 4: words from the
 *                     catalogue); the SDUI catalogue (STA-1981).
 */
import type { I18nKey } from "@stackra/i18n";

/**
 * The words of `text`.
 *
 * @example
 * specText("orders::actions.order.cancel.label", t); // "Cancel order"
 * specText("Cancel order", t); // "Cancel order"
 */
export function specText(
  text: string,
  t: (key: I18nKey, values?: Readonly<Record<string, unknown>>) => string,
): string {
  return text.indexOf("::") > 0 ? t(text as I18nKey) : text;
}
