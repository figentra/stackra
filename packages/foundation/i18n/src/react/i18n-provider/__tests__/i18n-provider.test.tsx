/**
 * Stackra file contract:
 * Purpose: unit tests of `I18nProvider`: it renders its children with the active locale's state (config from the
 *          container, the digit-aware Intl tag), the hooks under it read that state, the default `setLocale` rejects
 *          where the URL selects the locale, and both a missing provider and a missing container fail loudly.
 * Boundary: test only; renders with react-dom/server (no DOM needed).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0080; ADR 0295 (decision 7).
 */
import { buildConfig } from "@stackra/config";
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, it } from "@stackra/testing";
import { renderToString } from "react-dom/server";

import { I18nConfig } from "#config/i18n.config";
import { Locale } from "#core/enums/locale.enum";
import { NumberingSystem } from "#core/enums/numbering-system.enum";
import { I18nProvider } from "#react/i18n-provider/i18n-provider";
import type { I18nState } from "#react/i18n-provider/i18n-state.type";
import { useI18nState } from "#react/i18n-provider/use-i18n-state";

class ArabicDigitsConfig extends I18nConfig {
  override locales: Locale[] = [Locale.En, Locale.Ar];

  override numerals: NumberingSystem = NumberingSystem.Arab;
}

/** A container that binds `type` as the i18n configuration. */
async function containerWith(type: typeof I18nConfig) {
  return Container.create(
    [{ member: "web", config: [{ key: "i18n", provide: I18nConfig, override: type }] }],
    {
      overrides: new Map([[I18nConfig, buildConfig(type)]]),
    },
  );
}

/** Hands the provider's state to the test and renders its locale. */
function Probe({ onState }: { readonly onState: (state: I18nState) => void }) {
  const state = useI18nState();
  onState(state);
  return <span>{state.locale}</span>;
}

/** Drops the state, for the cases that only expect a throw. */
const ignore = () => undefined;

describe("I18nProvider", () => {
  it("gives the hooks under it the locale, catalogues, config and digit-aware tag", async () => {
    const states: I18nState[] = [];
    const messages = { web: { nav: { home: "الرئيسية" } } };
    const html = renderToString(
      <ContainerProvider container={await containerWith(ArabicDigitsConfig)}>
        <I18nProvider locale={Locale.Ar} messages={messages}>
          <Probe onState={(state) => states.push(state)} />
        </I18nProvider>
      </ContainerProvider>,
    );
    expect(html).toBe("<span>ar</span>");
    expect(states[0]?.intlLocale).toBe("ar-u-nu-arab");
    expect(states[0]?.messages).toBe(messages);
    expect(states[0]?.config.locales).toEqual(["en", "ar"]);
  });

  it("rejects setLocale where the URL selects the locale, and uses the given setter otherwise", async () => {
    const container = await containerWith(I18nConfig);
    const states: I18nState[] = [];
    const chosen: Locale[] = [];
    renderToString(
      <ContainerProvider container={container}>
        <I18nProvider locale={Locale.En} messages={{}}>
          <Probe onState={(state) => states.push(state)} />
        </I18nProvider>
        <I18nProvider
          locale={Locale.En}
          messages={{}}
          setLocale={async (locale) => {
            chosen.push(locale);
          }}
        >
          <Probe onState={(state) => states.push(state)} />
        </I18nProvider>
      </ContainerProvider>,
    );
    await expect(states[0]?.setLocale(Locale.Ar)).rejects.toThrow(/selects the locale by URL/);
    await states[1]?.setLocale(Locale.Ar);
    expect(chosen).toEqual(["ar"]);
  });

  it("fails without a provider and without a container", () => {
    expect(() => renderToString(<Probe onState={ignore} />)).toThrow(/I18nProvider/);
    expect(() =>
      renderToString(
        <I18nProvider locale={Locale.En} messages={{}}>
          <Probe onState={ignore} />
        </I18nProvider>,
      ),
    ).toThrow(/ContainerProvider/);
  });
});
