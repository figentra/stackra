/**
 * Stackra file contract:
 * Purpose: unit tests of `useMoney()`: minor units in a currency and a `Money` format alike, with the currency's own
 *          exponent (the template's "SAR 99.00", KWD's three digits, JPY's none), never rounded, in the configured
 *          digits; an unsafe amount or unknown currency is refused; and the hook throws outside a provider.
 * Boundary: test only; renders with react-dom/server.
 * Runtime: node (vitest, full ICU)
 * Governing contract: ADR 0022; ADR 0269; ADR 0220 (decision 2); ADR 0192.
 */
import { buildConfig } from "@stackra/config";
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { Rounding } from "@stackra/contracts";
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";
import { renderToString } from "react-dom/server";

import { I18nConfig } from "#config/i18n.config";
import { Locale } from "#core/enums/locale.enum";
import { NumberingSystem } from "#core/enums/numbering-system.enum";
import type { MoneyFormatter } from "#react/formatting/money-formatter.type";
import { useMoney } from "#react/formatting/use-money";
import { I18nProvider } from "#react/i18n-provider/i18n-provider";

class SiteI18nConfig extends I18nConfig {
  override locales: Locale[] = [Locale.En, Locale.Ar];
}

class ArabicDigitsConfig extends SiteI18nConfig {
  override numerals: NumberingSystem = NumberingSystem.Arab;
}

/** What `useMoney()` returns. */
type Formatter = MoneyFormatter;

/** Hands the hook's result to the test. */
function Probe({ onFormatter }: { readonly onFormatter: (formatter: Formatter) => void }) {
  onFormatter(useMoney());
  return null;
}

/** The `useMoney()` result for `locale` under config `type`. */
async function formatter(
  locale: Locale,
  type: typeof I18nConfig = SiteI18nConfig,
): Promise<Formatter> {
  const container = await Container.create(
    [{ member: "web", config: [{ key: "i18n", provide: I18nConfig, override: type }] }],
    { overrides: new Map([[I18nConfig, buildConfig(type)]]) },
  );
  const seen: Formatter[] = [];
  renderToString(
    <ContainerProvider container={container}>
      <I18nProvider locale={locale} messages={{}}>
        <Probe onFormatter={(next) => seen.push(next)} />
      </I18nProvider>
    </ContainerProvider>,
  );
  const [money] = seen;
  if (money === undefined) throw new Error("Probe did not render");
  return money;
}

describe("useMoney", () => {
  it("formats minor units in a currency, as the pricing table shows them", async () => {
    const money = await formatter(Locale.En);
    // Intl joins a currency code to the amount with a no-break space, so the two never wrap apart.
    expect(money(9900, "SAR")).toBe("SAR\u00A099.00");
    expect(money(1250, "USD")).toBe("$12.50");
  });

  it("formats a Money, the per-month equivalent rounded down by the caller", async () => {
    const money = await formatter(Locale.En);
    expect(money(Money.ofMinor(100_000, "SAR").divide(12, Rounding.Down))).toBe("SAR\u00A083.33");
  });

  it("shows exactly the currency's exponent of fraction digits", async () => {
    const money = await formatter(Locale.En);
    expect(money(1250, "KWD")).toBe("KWD\u00A01.250");
    expect(money(1000, "JPY")).toBe("¥1,000");
  });

  it("uses the configured digits", async () => {
    const money = await formatter(Locale.En, ArabicDigitsConfig);
    expect(money(9900, "SAR")).toMatch(/٩٩.٠٠/);
  });

  it("refuses an unsafe amount and an unknown currency", async () => {
    const money = await formatter(Locale.En);
    expect(() => money(Number.MAX_SAFE_INTEGER + 2, "USD")).toThrow(RangeError);
    expect(() => money(100, "usd")).toThrow(RangeError);
  });

  it("throws outside a provider", () => {
    expect(() => renderToString(<Probe onFormatter={() => undefined} />)).toThrow(/I18nProvider/);
  });
});
