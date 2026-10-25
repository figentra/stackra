/**
 * Stackra file contract:
 * Purpose: unit tests of `useLocale()`: the active locale, the direction from the member's `rtl` set, endonyms from
 *          the `Locale` case data, the provider's setter passed through, and the error outside a provider.
 * Boundary: test only; renders with react-dom/server.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0080; ADR 0297 (decision 4).
 */
import { buildConfig } from "@stackra/config";
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, it } from "@stackra/testing";
import { renderToString } from "react-dom/server";

import { I18nConfig } from "#config/i18n.config";
import { Locale } from "#core/enums/locale.enum";
import { I18nProvider } from "#react/i18n-provider/i18n-provider";
import type { LocaleState } from "#react/locale/locale-state.type";
import { useLocale } from "#react/locale/use-locale";

class SiteI18nConfig extends I18nConfig {
  override locales: Locale[] = [Locale.En, Locale.EnUs, Locale.Ar, Locale.ArSa];
}

/** Hands the hook's result to the test. */
function Probe({ onState }: { readonly onState: (state: LocaleState) => void }) {
  onState(useLocale());
  return null;
}

/** The `useLocale()` result under a provider for `locale`. */
async function localeState(
  locale: Locale,
  setLocale?: (next: Locale) => Promise<void>,
): Promise<LocaleState> {
  const container = await Container.create(
    [{ member: "web", config: [{ key: "i18n", provide: I18nConfig, override: SiteI18nConfig }] }],
    { overrides: new Map([[I18nConfig, buildConfig(SiteI18nConfig)]]) },
  );
  const seen: LocaleState[] = [];
  renderToString(
    <ContainerProvider container={container}>
      <I18nProvider
        locale={locale}
        messages={{}}
        {...(setLocale === undefined ? {} : { setLocale })}
      >
        <Probe onState={(state) => seen.push(state)} />
      </I18nProvider>
    </ContainerProvider>,
  );
  const [state] = seen;
  if (state === undefined) throw new Error("Probe did not render");
  return state;
}

describe("useLocale", () => {
  it("reads the active locale and its direction from the member's rtl set", async () => {
    const english = await localeState(Locale.EnUs);
    expect(english.locale).toBe("en-US");
    expect(english.direction).toBe("ltr");
    expect((await localeState(Locale.ArSa)).direction).toBe("rtl");
  });

  it("names each locale in its own language, safely destructured", async () => {
    const { endonym } = await localeState(Locale.En);
    expect(endonym(Locale.Ar)).toBe("العربية");
    expect(endonym(Locale.En)).toBe("English");
  });

  it("passes the provider's setter through", async () => {
    const chosen: Locale[] = [];
    const { setLocale } = await localeState(Locale.En, async (next) => {
      chosen.push(next);
    });
    await setLocale(Locale.Ar);
    expect(chosen).toEqual(["ar"]);
  });

  it("throws outside a provider", () => {
    expect(() => renderToString(<Probe onState={() => undefined} />)).toThrow(/I18nProvider/);
  });
});
