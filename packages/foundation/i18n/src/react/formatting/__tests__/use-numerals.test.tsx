/**
 * Stackra file contract:
 * Purpose: unit tests of `useNumerals()`: the provider's digits under it, and `user` (nothing forced) without one.
 * Boundary: test only; renders with react-dom/server.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0192 (decision 2, as amended 2026-10-28).
 */
import { buildConfig } from "@stackra/config";
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, it } from "@stackra/testing";
import { renderToString } from "react-dom/server";

import { I18nConfig } from "#config/i18n.config";
import { Locale } from "#core/enums/locale.enum";
import { NumberingSystem } from "#core/enums/numbering-system.enum";
import { useNumerals } from "#react/formatting/use-numerals";
import { I18nProvider } from "#react/i18n-provider/i18n-provider";

class ScopeDigitsConfig extends I18nConfig {
  override scopeChoosesNumerals = true;
}

/** Renders the hook's answer. */
function Probe() {
  return <i>{useNumerals()}</i>;
}

describe("useNumerals", () => {
  it("reads the provider's digits", async () => {
    const container = await Container.create(
      [
        {
          member: "web",
          config: [{ key: "i18n", provide: I18nConfig, override: ScopeDigitsConfig }],
        },
      ],
      { overrides: new Map([[I18nConfig, buildConfig(ScopeDigitsConfig)]]) },
    );
    const html = renderToString(
      <ContainerProvider container={container}>
        <I18nProvider locale={Locale.En} messages={{}} numerals={NumberingSystem.Arab}>
          <Probe />
        </I18nProvider>
        <I18nProvider locale={Locale.En} messages={{}}>
          <Probe />
        </I18nProvider>
      </ContainerProvider>,
    );
    expect(html).toBe("<i>arab</i><i>latn</i>");
  });

  it("is user without a provider", () => {
    expect(renderToString(<Probe />)).toBe("<i>user</i>");
  });
});
