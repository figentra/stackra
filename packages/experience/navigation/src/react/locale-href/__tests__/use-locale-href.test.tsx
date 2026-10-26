/**
 * Stackra file contract:
 * Purpose: unit tests of `useLocaleHref`: the current page with its query in another mount, back to the unprefixed
 *          default, and unchanged without an I18nConfig.
 * Boundary: test only; jsdom with `renderHook` under a memory router.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0297 (decision 4); ADR 0301 (decision 6).
 */
// @vitest-environment jsdom
import { buildConfig } from "@stackra/config";
import { Container, type Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { I18nConfig, Locale } from "@stackra/i18n";
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";

import { useLocaleHref } from "#react/locale-href/use-locale-href";

class SiteI18nConfig extends I18nConfig {
  override locales: Locale[] = [Locale.En, Locale.EnUs, Locale.Ar, Locale.ArSa];
}

/** A wrapper at `path`. */
async function wrapperAt(path: string, withI18n = true) {
  const overrides = new Map<Token, object>(
    withI18n ? [[I18nConfig, buildConfig(SiteI18nConfig)]] : [],
  );
  const container = await Container.create([], { overrides });
  return ({ children }: { children: ReactNode }) => (
    <ContainerProvider container={container}>
      <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
    </ContainerProvider>
  );
}

describe("useLocaleHref", () => {
  it("moves the current page to another mount, query kept", async () => {
    const { result } = renderHook(() => useLocaleHref(), {
      wrapper: await wrapperAt("/pricing?interval=year"),
    });
    expect(result.current(Locale.ArSa)).toBe("/ar-sa/pricing?interval=year");
  });

  it("moves back to the unprefixed default", async () => {
    const { result } = renderHook(() => useLocaleHref(), {
      wrapper: await wrapperAt("/ar-sa/pricing"),
    });
    expect(result.current(Locale.En)).toBe("/pricing");
  });

  it("returns the current href without an I18nConfig", async () => {
    const { result } = renderHook(() => useLocaleHref(), {
      wrapper: await wrapperAt("/pricing", false),
    });
    expect(result.current(Locale.Ar)).toBe("/pricing");
  });
});
