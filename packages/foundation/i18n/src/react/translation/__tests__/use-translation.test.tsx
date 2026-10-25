/**
 * Stackra file contract:
 * Purpose: unit tests of `useTranslation()`: `t` translates typed keys with ICU arguments in the provider's locale,
 *          applies the configured digits, survives destructuring, and throws outside a provider.
 * Boundary: test only; renders with react-dom/server.
 * Runtime: node (vitest, full ICU)
 * Governing contract: ADR 0022; ADR 0269; ADR 0268 (R15); ADR 0192.
 */
import { buildConfig } from "@stackra/config";
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, it } from "@stackra/testing";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";

import { I18nConfig } from "#config/i18n.config";
import { Locale } from "#core/enums/locale.enum";
import { NumberingSystem } from "#core/enums/numbering-system.enum";
import { keys } from "#core/functions/keys.function";
import { I18nProvider } from "#react/i18n-provider/i18n-provider";
import { useTranslation } from "#react/translation/use-translation";

const I18n = keys({ web: { nav: ["home"], locale_suggestion: ["body"], store: ["count"] } });

const MESSAGES = {
  web: {
    nav: { home: "الرئيسية" },
    locale_suggestion: { body: "هذه الصفحة متاحة بلغة {language}" },
    store: { count: "{count, plural, one {منتج واحد} other {# منتج}}" },
  },
};

class SiteI18nConfig extends I18nConfig {
  override locales: Locale[] = [Locale.En, Locale.Ar];
}

class UserDigitsConfig extends SiteI18nConfig {
  override numerals: NumberingSystem = NumberingSystem.User;
}

/** Renders `ui` under a container binding `type` and a provider for Arabic. */
async function render(ui: ReactNode, type: typeof I18nConfig = SiteI18nConfig): Promise<string> {
  const container = await Container.create(
    [{ member: "web", config: [{ key: "i18n", provide: I18nConfig, override: type }] }],
    { overrides: new Map([[I18nConfig, buildConfig(type)]]) },
  );
  return renderToString(
    <ContainerProvider container={container}>
      <I18nProvider locale={Locale.Ar} messages={MESSAGES}>
        {ui}
      </I18nProvider>
    </ContainerProvider>,
  );
}

/** Uses `t` destructured, as class components do in `render()`. */
function Labels() {
  const { t } = useTranslation();
  const labels = [
    t(I18n.web.nav.home),
    t(I18n.web.locale_suggestion.body, { language: "English" }),
    t(I18n.web.store.count, { count: 12 }),
  ];
  return <p>{labels.join("|")}</p>;
}

describe("useTranslation", () => {
  it("translates typed keys with ICU arguments in the provider's locale and digits", async () => {
    expect(await render(<Labels />)).toBe("<p>الرئيسية|هذه الصفحة متاحة بلغة English|12 منتج</p>");
  });

  it("leaves the digits to the locale when numerals are the user's", async () => {
    expect(await render(<Labels />, UserDigitsConfig)).toContain("١٢ منتج");
  });

  it("throws outside a provider", () => {
    expect(() => renderToString(<Labels />)).toThrow(/I18nProvider/);
  });
});
