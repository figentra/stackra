/**
 * Stackra file contract:
 * Purpose: `formatMessage(messages, key, values, locale)`, the ICU engine: it finds the key's message in the merged
 *          catalogues and formats it with the values (arguments, `plural` with all six CLDR categories, `select`,
 *          `number`, `date`), on the server (gen's `translatorFor`) and behind the React `t()`.
 * Boundary: pure apart from a cache of compiled messages per locale and message text. Fallback is not resolved here:
 *           `messages` is already merged along the locale's chain, so a key missing from it is missing from every
 *           locale of the chain, which gen refuses; it throws instead of rendering the raw key. Rich-text tags are
 *           kept as literal text (a string API has no element to wrap).
 * Runtime: isomorphic
 * Governing contract: ADR 0268 (R15: ICU syntax, typed keys), ADR 0080 (as amended by 0305 conventions 1), ADR 0192.
 */
import { IntlMessageFormat, type PrimitiveType } from "intl-messageformat";

import type { I18nKey } from "#core/types/i18n-key.type";
import type { Messages } from "#core/types/messages.type";

/** Compiled messages by `<locale>\u0000<message>`; the set is bounded by the catalogues' strings. */
const COMPILED = new Map<string, IntlMessageFormat>();

/** The message string at `path` in `catalogue`, or undefined. */
function lookUp(catalogue: unknown, path: readonly string[]): unknown {
  let node = catalogue;
  for (const segment of path) {
    if (typeof node !== "object" || node === null || !Object.hasOwn(node, segment))
      return undefined;
    node = (node as Record<string, unknown>)[segment];
  }
  return node;
}

/**
 * The formatted message of `key`.
 *
 * @param messages - the merged catalogues by namespace (gen's `loadMessages`).
 * @param key - a typed key from `#stackra/i18n` (`I18n.web.nav.home`).
 * @param values - the ICU arguments; `undefined` when the message has none.
 * @param locale - the BCP 47 tag the plural rules and formats follow (a `Locale`, or one with a `-u-nu-` extension).
 * @throws RangeError when the key is not `<namespace>::<path>` or no message exists for it.
 * @example
 * formatMessage({ web: { cta: { button: "Start {days}-day trial" } } }, I18n.web.cta.button, { days: 14 }, "en");
 * // "Start 14-day trial"
 */
export function formatMessage(
  messages: Messages,
  key: I18nKey,
  values: Readonly<Record<string, unknown>> | undefined,
  locale: string,
): string {
  const at = key.indexOf("::");
  if (at <= 0) throw new RangeError(`"${key}" is not an i18n key (<namespace>::<path>)`);
  const message = lookUp(messages[key.slice(0, at)], key.slice(at + 2).split("."));
  if (typeof message !== "string")
    throw new RangeError(
      `No message for "${key}" in locale ${locale}: run stackra gen to check the lang files`,
    );
  const cacheKey = `${locale}\u0000${message}`;
  let compiled = COMPILED.get(cacheKey);
  if (compiled === undefined) {
    compiled = new IntlMessageFormat(message, locale, undefined, { ignoreTag: true });
    COMPILED.set(cacheKey, compiled);
  }
  const out = compiled.format(values as Record<string, PrimitiveType> | undefined);
  return Array.isArray(out) ? out.join("") : String(out);
}
