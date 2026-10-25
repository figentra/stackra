# @stackra/i18n

Stackra i18n: the locale vocabulary, the i18n configuration every member overrides, the ICU message engine over
namespaced catalogues with regional overlays, the typed key builder gen calls, and the React provider and formatting
hooks. It replaces i18next (ADR 0080).

**Tier:** `tier:lib` (`packages/foundation/i18n`). Entries `.` and `./react`. Depends on `@stackra/contracts`,
`@stackra/config`, `@stackra/money`, `@stackra/validation`, `intl-messageformat` and zod; React is an optional peer
of `./react`.

## What is here

| Entry     | Symbol                                 | Use                                                                              |
| --------- | -------------------------------------- | -------------------------------------------------------------------------------- |
| `.`       | `Locale`                               | `Locale.En`, `Locale.EnUs`, `Locale.Ar`, `Locale.ArSa`; BCP 47 codes             |
| `.`       | `NumberingSystem`                      | `Latn` (default), `Arab`, `User` (the locale's and device's own digits)          |
| `.`       | `LocaleUrlStrategy`                    | `PrefixExceptDefault` (default), `Prefix`                                        |
| `.`       | `I18nConfig`                           | the configuration a member overrides in `src/config/i18n.config.ts`              |
| `.`       | `I18nConfig$`                          | its shipped zod schema; generated schemas reuse it with `.extend(...)`           |
| `.`       | `keys`                                 | gen's `export const I18n = keys({...})` in `#stackra/i18n`                       |
| `.`       | `mergeCatalogues`                      | gen's `loadMessages`: merges the fallback chain, farthest first                  |
| `.`       | `formatMessage`                        | the ICU engine; gen's server-side `translatorFor`                                |
| `.`       | `I18nKey`, `LoadCatalogue`             | types                                                                            |
| `./react` | `useTranslation`                       | `const { t } = useTranslation(); t(I18n.web.nav.home)`                           |
| `./react` | `useLocale`                            | `locale`, `direction`, `endonym(code)`, `setLocale(code)`                        |
| `./react` | `useLocaleChoice`                      | the visitor's remembered choice: `chosen`, `choose(code)`                        |
| `./react` | `useMoney`, `useNumber`, `useDateTime` | formatting in the active locale and digits                                       |
| `./react` | `I18nProvider`                         | mounted by the generated `Contexts` of `@stackra/app` with locale and catalogues |

## Configuring a member

```ts
// src/config/i18n.config.ts
import {
  I18nConfig as BaseI18nConfig,
  Locale,
  LocaleUrlStrategy,
  NumberingSystem,
} from "@stackra/i18n";

export class I18nConfig extends BaseI18nConfig {
  override locales: Locale[] = [Locale.En, Locale.EnUs, Locale.Ar, Locale.ArSa];
  override defaultLocale: Locale = Locale.En;
  override rtl: Locale[] = [Locale.Ar, Locale.ArSa];
  override fallbacks: Record<string, Locale[]> = {
    [Locale.ArSa]: [Locale.Ar, Locale.En],
    [Locale.Ar]: [Locale.En],
    [Locale.EnUs]: [Locale.En],
    [Locale.En]: [],
  };
  override numerals: NumberingSystem = NumberingSystem.Latn;
  override urlStrategy: LocaleUrlStrategy = LocaleUrlStrategy.PrefixExceptDefault;
}
```

The defaults are a launch member's: English only, Latin digits, `ar` and `ar-SA` right-to-left, the `locale` cookie.
`buildConfig` refuses a default locale or a fallback locale that is not in `locales`.

## Catalogues and keys

A catalogue is `assets/lang/<locale>/<namespace>.json`, nested by path. A regional overlay (`en-US`, `ar-SA`) holds
only the keys that differ; gen's `loadMessages` merges the chain farthest first with `mergeCatalogues`, so the nearest
locale wins key by key. Gen writes the typed tree:

```ts
export const I18n = keys({
  web: { nav: ["home"], features: { _: ["title"], catalogue: ["title"] } },
});
I18n.web.nav.home; // "web::nav.home", typed I18nKey
I18n.web.features.title; // "web::features.title": `_` lists a branch's own leaves
```

Messages are ICU: arguments, `plural` (Arabic needs `zero one two few many other`), `select`, `number`, `date`. A key
with no message after the merge throws: gen refuses missing keys, so the raw key never renders.

## Digits and formatting

`I18nConfig.numerals` becomes the `-u-nu-` extension of the locale tag every formatter uses, so messages, numbers,
money and dates share one digit choice. `useMoney()` formats `money(minor, currency)` or `money(Money)` with exactly
the currency's ISO 4217 exponent of fraction digits (`SAR 99.00`, `KWD 1.250`, `¥1,000`).

## The remembered choice (web)

The URL alone selects the locale on the web (ADR 0297 decision 4). `useLocaleChoice()` reads and writes the cookie
named by `cookieName` in the browser only; the server and the first paint see `null`, and nothing reads it to
redirect. `useLocale().setLocale` rejects on the web (switching is a navigation) and works where the runtime passes a
setter to `I18nProvider` (native, the console).

Governing ADRs: 0080 (as amended by 0192, 0268, 0305), 0192, 0220, 0231, 0234, 0294 (decisions 15, 19 and 20), 0297
(decision 4), 0305.
