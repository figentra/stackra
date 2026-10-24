/**
 * Stackra file contract:
 * Purpose: unit tests of `I18nMount`: it provides the locale and catalogues to the i18n hooks, and passes the setter
 *          through when given (absent, `setLocale` rejects because the URL selects the locale).
 * Boundary: test only; renders with react-dom/server.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0295 (decision 10); ADR 0080.
 */
import { buildConfig } from "@stackra/config";
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { I18nConfig, Locale } from "@stackra/i18n";
import { useLocale } from "@stackra/i18n/react";
import { describe, expect, it, vi } from "@stackra/testing";
import { renderToString } from "react-dom/server";

import { I18nMount } from "#react/contexts/i18n-mount";

class ArabicI18nConfig extends I18nConfig {
  override locales: Locale[] = [Locale.En, Locale.Ar];
}

/** A container that binds the i18n configuration. */
const container = () =>
  Container.create(
    [{ member: "web", config: [{ key: "i18n", provide: I18nConfig, override: ArabicI18nConfig }] }],
    {
      overrides: new Map([[I18nConfig, buildConfig(ArabicI18nConfig)]]),
    },
  );

/** Hands the locale state to the test and renders the locale and direction. */
function Probe({
  onSetLocale,
}: {
  readonly onSetLocale: (set: (locale: Locale) => Promise<void>) => void;
}) {
  const { locale, direction, setLocale } = useLocale();
  onSetLocale(setLocale);
  return <span>{`${locale}:${direction}`}</span>;
}

describe("I18nMount", () => {
  it("provides the locale to the i18n hooks", async () => {
    let set: ((locale: Locale) => Promise<void>) | undefined;
    const html = renderToString(
      <ContainerProvider container={await container()}>
        <I18nMount locale={Locale.Ar} messages={{}}>
          <Probe onSetLocale={(fn) => (set = fn)} />
        </I18nMount>
      </ContainerProvider>,
    );
    expect(html).toBe("<span>ar:rtl</span>");
    await expect(set?.(Locale.En)).rejects.toThrow(/URL/);
  });

  it("passes the setter through", async () => {
    const setLocale = vi.fn(() => Promise.resolve());
    let set: ((locale: Locale) => Promise<void>) | undefined;
    renderToString(
      <ContainerProvider container={await container()}>
        <I18nMount locale={Locale.En} messages={{}} setLocale={setLocale}>
          <Probe onSetLocale={(fn) => (set = fn)} />
        </I18nMount>
      </ContainerProvider>,
    );
    await set?.(Locale.Ar);
    expect(setLocale).toHaveBeenCalledWith(Locale.Ar);
  });
});
