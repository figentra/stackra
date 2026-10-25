// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of `useLocaleChoice()`: `null` before a choice and on the server, `choose` writes the configured
 *          cookie (path, a year, `SameSite=Lax`) and re-renders every reader, a cookie value that is not a shipped
 *          locale reads as `null`, and the hook throws outside a provider.
 * Boundary: test only; jsdom supplies `document.cookie`; the server render uses react-dom/server.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0297 (decision 4: remembered, never read to redirect).
 */
import { buildConfig } from "@stackra/config";
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";

import { I18nConfig } from "#config/i18n.config";
import { Locale } from "#core/enums/locale.enum";
import { I18nProvider } from "#react/i18n-provider/i18n-provider";
import { useLocaleChoice } from "#react/locale/use-locale-choice";

class SiteI18nConfig extends I18nConfig {
  override locales: Locale[] = [Locale.En, Locale.Ar, Locale.ArSa];

  override cookieName = "site_locale";
}

/** A wrapper with a container binding the site config and an English provider. */
async function wrapper() {
  const container = await Container.create(
    [{ member: "web", config: [{ key: "i18n", provide: I18nConfig, override: SiteI18nConfig }] }],
    { overrides: new Map([[I18nConfig, buildConfig(SiteI18nConfig)]]) },
  );
  return function Wrapper({ children }: { readonly children?: ReactNode }) {
    return (
      <ContainerProvider container={container}>
        <I18nProvider locale={Locale.En} messages={{}}>
          {children}
        </I18nProvider>
      </ContainerProvider>
    );
  };
}

/** Renders the remembered choice, or `none`. */
function Chosen() {
  return <span>{useLocaleChoice().chosen ?? "none"}</span>;
}

afterEach(() => {
  document.cookie = "site_locale=; Path=/; Max-Age=0";
});

describe("useLocaleChoice", () => {
  it("is null before a choice, then remembers the chosen locale in the configured cookie", async () => {
    const { result } = renderHook(() => useLocaleChoice(), { wrapper: await wrapper() });
    expect(result.current.chosen).toBeNull();
    act(() => result.current.choose(Locale.ArSa));
    expect(result.current.chosen).toBe("ar-SA");
    expect(document.cookie).toContain("site_locale=ar-SA");
  });

  it("re-renders every reader after a choice", async () => {
    const Wrapper = await wrapper();
    const first = renderHook(() => useLocaleChoice(), { wrapper: Wrapper });
    const second = renderHook(() => useLocaleChoice(), { wrapper: Wrapper });
    act(() => first.result.current.choose(Locale.Ar));
    expect(second.result.current.chosen).toBe("ar");
  });

  it("reads a cookie value that is not a shipped locale as no choice", async () => {
    document.cookie = "site_locale=fr; Path=/";
    const { result } = renderHook(() => useLocaleChoice(), { wrapper: await wrapper() });
    expect(result.current.chosen).toBeNull();
  });

  it("is null on the server even when the cookie holds a choice", async () => {
    document.cookie = "site_locale=ar; Path=/";
    const Wrapper = await wrapper();
    expect(
      renderToString(
        <Wrapper>
          <Chosen />
        </Wrapper>,
      ),
    ).toBe("<span>none</span>");
  });

  it("throws outside a provider", () => {
    expect(() => renderHook(() => useLocaleChoice())).toThrow(/I18nProvider/);
  });
});
