/**
 * Stackra file contract:
 * Purpose: the page of the NumberValue route: `@stackra/ui-pro`'s NumberValue formatting one amount as currency in
 *          four currencies, as a compact figure at four sizes, and with a prefix and a suffix, each in a labelled
 *          description list.
 * Boundary: presentation only. The number is formatted for the document's locale by the browser, so the digits and
 *          separators follow the page's language.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra/ui-pro/react";

import { ProNumberValueRoute } from "#src/routes/pro-number-value/pro-number-value.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-number-value.*` keys.
const STRINGS = {
  documentTitle: `${ProNumberValueRoute.title} · Stackra Playground`,
  intro:
    "A number shown in a locale-aware format: currency, a compact figure, or a plain value with a unit before or after it.",
  currency: "Currency",
  compact: "Compact",
  unit: "With a prefix and a suffix",
  prefix: "About",
  perMonth: "per month",
  of: "of storage",
} as const;

const CURRENCIES = ["USD", "EUR", "JPY", "GBP"] as const;
const COMPACT = [1234, 45678, 1234567, 9876543210] as const;

const VALUE = "text-2xl font-semibold";

/** The NumberValue page. */
export function ProNumberValue() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProNumberValueRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="currency-heading" className="grid gap-3">
        <h2 id="currency-heading" className="type-h2">
          {STRINGS.currency}
        </h2>
        <dl className="grid gap-2">
          {CURRENCIES.map((currency) => (
            <div key={currency} className="flex items-baseline gap-4">
              <dt className="w-16 text-sm text-muted">{currency}</dt>
              <dd>
                <UiPro.NumberValue
                  className={VALUE}
                  style="currency"
                  currency={currency}
                  maximumFractionDigits={currency === "JPY" ? 0 : 2}
                  value={228441}
                />
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <section aria-labelledby="compact-heading" className="grid gap-3">
        <h2 id="compact-heading" className="type-h2">
          {STRINGS.compact}
        </h2>
        <dl className="grid gap-2">
          {COMPACT.map((value) => (
            <div key={value} className="flex items-baseline gap-4">
              <dt className="w-32 text-sm tabular-nums text-muted">
                {value.toLocaleString("en-US")}
              </dt>
              <dd>
                <UiPro.NumberValue className={VALUE} notation="compact" value={value} />
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <section aria-labelledby="unit-heading" className="grid gap-3">
        <h2 id="unit-heading" className="type-h2">
          {STRINGS.unit}
        </h2>
        <dl className="grid gap-2">
          <div className="flex items-baseline gap-4">
            <dt className="w-32 text-sm text-muted">{STRINGS.perMonth}</dt>
            <dd>
              <UiPro.NumberValue
                className={VALUE}
                style="currency"
                currency="USD"
                maximumFractionDigits={0}
                value={49}
              >
                <UiPro.NumberValue.Prefix>
                  <span className="text-sm font-normal">{STRINGS.prefix} </span>
                </UiPro.NumberValue.Prefix>
                <UiPro.NumberValue.Suffix>
                  <span className="text-sm font-normal"> / {STRINGS.perMonth}</span>
                </UiPro.NumberValue.Suffix>
              </UiPro.NumberValue>
            </dd>
          </div>
          <div className="flex items-baseline gap-4">
            <dt className="w-32 text-sm text-muted">{STRINGS.of}</dt>
            <dd>
              <UiPro.NumberValue className={VALUE} value={72} maximumFractionDigits={0}>
                <UiPro.NumberValue.Suffix>
                  <span className="text-sm font-normal"> GB {STRINGS.of}</span>
                </UiPro.NumberValue.Suffix>
              </UiPro.NumberValue>
            </dd>
          </div>
        </dl>
      </section>
    </article>
  );
}
