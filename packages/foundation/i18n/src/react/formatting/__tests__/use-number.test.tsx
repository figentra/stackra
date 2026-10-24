/**
 * Stackra file contract:
 * Purpose: unit tests of `useNumber()`: grouping in the active locale, Intl options passed through, the configured
 *          digits applied, and the error outside a provider.
 * Boundary: test only; renders with react-dom/server.
 * Runtime: node (vitest, full ICU)
 * Governing contract: ADR 0022; ADR 0269; ADR 0192 (decision 2).
 */
import { buildConfig } from "@stackra/config";
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, it } from "@stackra/testing";
import { renderToString } from "react-dom/server";

import { I18nConfig } from "#config/i18n.config";
import { Locale } from "#core/enums/locale.enum";
import { NumberingSystem } from "#core/enums/numbering-system.enum";
import { useNumber } from "#react/formatting/use-number";
import { I18nProvider } from "#react/i18n-provider/i18n-provider";

class SiteI18nConfig extends I18nConfig {
  override locales: Locale[] = [Locale.En, Locale.Ar];
}

class ArabicDigitsConfig extends SiteI18nConfig {
  override numerals: NumberingSystem = NumberingSystem.Arab;
}

/** What `useNumber()` returns. */
type Formatter = ReturnType<typeof useNumber>;

/** Hands the hook's result to the test. */
function Probe({ onFormatter }: { readonly onFormatter: (formatter: Formatter) => void }) {
  onFormatter(useNumber());
  return null;
}

/** The `useNumber()` result for `locale` under config `type`. */
async function formatter(locale: Locale, type: typeof I18nConfig = SiteI18nConfig) {
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
  const [number] = seen;
  if (number === undefined) throw new Error("Probe did not render");
  return number;
}

describe("useNumber", () => {
  it("groups in the active locale and passes Intl options through", async () => {
    const number = await formatter(Locale.En);
    expect(number(12_500)).toBe("12,500");
    expect(number(0.25, { style: "percent" })).toBe("25%");
    expect(number(12_500n)).toBe("12,500");
  });

  it("keeps Latin digits in Arabic by default and applies Arabic-Indic when configured", async () => {
    expect(await formatter(Locale.Ar).then((number) => number(42))).toBe("42");
    expect(await formatter(Locale.En, ArabicDigitsConfig).then((number) => number(42))).toBe("٤٢");
  });

  it("throws outside a provider", () => {
    expect(() => renderToString(<Probe onFormatter={() => undefined} />)).toThrow(/I18nProvider/);
  });
});
