/**
 * Stackra file contract:
 * Purpose: `LocaleUrlStrategy`, how a locale appears in a web member's URLs: every locale under its own prefix, or
 *          every locale but the default.
 * Boundary: an `Enum.of` value plus the type of the same name. Gen reads it to mount the route tree once per locale;
 *           a prefix is the lowercase BCP 47 tag (`/ar-sa/`). The URL alone selects the locale: neither case ever
 *           redirects on a cookie, a language header or an address (ADR 0297 decision 4).
 * Runtime: isomorphic
 * Governing contract: ADR 0297 (decision 4), ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The URL strategies of `I18nConfig.urlStrategy`. */
export const LocaleUrlStrategy = Enum.of({
  /** The default locale unprefixed (`/pricing`), every other under its tag (`/ar-sa/pricing`); the default. */
  PrefixExceptDefault: "prefix_except_default",
  /** Every locale under its tag, the default included (`/en/pricing`, `/ar-sa/pricing`). */
  Prefix: "prefix",
});

/** One of the codes above. */
export type LocaleUrlStrategy = Enum.Value<typeof LocaleUrlStrategy>;
