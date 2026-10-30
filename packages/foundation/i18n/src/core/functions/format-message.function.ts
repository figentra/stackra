/**
 * Stackra file contract:
 * Purpose: `formatMessage(messages, key, values, locale)`, the ICU engine: it finds the key's message in the merged
 *          catalogues and formats it with the values (arguments, `plural` with all six CLDR categories, `select`,
 *          `number`, `date`), on the server (gen's `translatorFor`) and behind the React `t()`. Its numbers (`number`,
 *          a plural's `#`) and dates (`date`, `time`) are written in the numbering system the locale tag's `-u-nu-`
 *          keyword names (or `numerals`), through `numberFormatIn` and `dateTimeFormatIn`, so the digits setting holds
 *          on every engine, Hermes on iOS included.
 * Boundary: pure apart from a cache of compiled messages per locale, digits and message text. A plain `{count}`
 *           argument is intl-messageformat's `String(count)`, unformatted: a message shows a number as `{count, number}`. Fallback is not resolved here:
 *           `messages` is already merged along the locale's chain, so a key missing from it is missing from every
 *           locale of the chain, which gen refuses; it throws instead of rendering the raw key. Rich-text tags are
 *           kept as literal text (a string API has no element to wrap).
 * Runtime: isomorphic
 * Governing contract: ADR 0268 (R15: ICU syntax, typed keys), ADR 0080 (as amended by 0305 conventions 1), ADR 0192.
 */
import { IntlMessageFormat, type PrimitiveType } from "intl-messageformat";

import { NumberingSystem } from "#core/enums/numbering-system.enum";
import { dateTimeFormatIn } from "#core/functions/date-time-format-in.function";
import { installPluralRules } from "#core/functions/install-plural-rules.function";
import { numberFormatIn } from "#core/functions/number-format-in.function";
import { numeralsOf } from "#core/functions/numerals-of.function";
import type { I18nKey } from "#core/types/i18n-key.type";
import type { Messages } from "#core/types/messages.type";

// Hermes on iOS has no Intl.PluralRules, and intl-messageformat reads the global one.
installPluralRules();

/** Compiled messages by `<locale>\u0000<numerals>\u0000<message>`; the set is bounded by the catalogues' strings. */
const COMPILED = new Map<string, IntlMessageFormat>();

/** The formatters intl-messageformat calls, by numbering system. */
type Formatters = NonNullable<ConstructorParameters<typeof IntlMessageFormat>[3]>["formatters"];

/** Number and date formatters by `<numerals>\u0000<locales>\u0000<options>`, as intl-messageformat memoizes its own. */
const FORMATS = new Map<string, unknown>();

/** The formatter `make` builds for `key`, built once. */
function memo<T>(key: string, make: () => T): T {
  if (!FORMATS.has(key)) FORMATS.set(key, make());
  return FORMATS.get(key) as T;
}

/** The one tag intl-messageformat hands a formatter (a tag, or a list whose first is the message's). */
const tagOf = (locales: unknown) => String(Array.isArray(locales) ? locales[0] : locales);

/** intl-messageformat's formatters, writing `numerals`; `user` keeps its own. */
function formattersFor(numerals: NumberingSystem): Formatters {
  if (numerals === NumberingSystem.User) return undefined;
  return {
    getNumberFormat: (locales, options) =>
      memo(`${numerals}\u0000n${tagOf(locales)}\u0000${JSON.stringify(options)}`, () =>
        // reason: intl-messageformat's options type widens `useGrouping` to ES2023's strings, which Intl reads alike.
        numberFormatIn(tagOf(locales), options as Intl.NumberFormatOptions | undefined, numerals),
      ) as unknown as Intl.NumberFormat,
    getDateTimeFormat: (locales, options) =>
      memo(`${numerals}\u0000d${tagOf(locales)}\u0000${JSON.stringify(options)}`, () =>
        dateTimeFormatIn(tagOf(locales), options, numerals),
      ) as unknown as Intl.DateTimeFormat,
    getPluralRules: (locales, options) =>
      memo(
        `p${tagOf(locales)}\u0000${JSON.stringify(options)}`,
        () => new Intl.PluralRules(tagOf(locales), options),
      ),
  };
}

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
 * @param numerals - the digits of its numbers and dates; by default the ones `locale`'s `-u-nu-` keyword names.
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
  numerals: NumberingSystem = numeralsOf(locale),
): string {
  const at = key.indexOf("::");
  if (at <= 0) throw new RangeError(`"${key}" is not an i18n key (<namespace>::<path>)`);
  const message = lookUp(messages[key.slice(0, at)], key.slice(at + 2).split("."));
  if (typeof message !== "string")
    throw new RangeError(
      `No message for "${key}" in locale ${locale}: run stackra gen to check the lang files`,
    );
  const cacheKey = `${locale}\u0000${numerals}\u0000${message}`;
  let compiled = COMPILED.get(cacheKey);
  if (compiled === undefined) {
    const formatters = formattersFor(numerals);
    compiled = new IntlMessageFormat(message, locale, undefined, {
      ignoreTag: true,
      ...(formatters === undefined ? {} : { formatters }),
    });
    COMPILED.set(cacheKey, compiled);
  }
  const out = compiled.format(values as Record<string, PrimitiveType> | undefined);
  return Array.isArray(out) ? out.join("") : String(out);
}
