/**
 * Stackra file contract:
 * Purpose: `ShowcaseI18n`, the playground's i18n mount: a container that binds `I18nConfig` (English and Arabic) and
 *          `I18nProvider` with the picked locale's catalogues, so `useCatalogueText`, `useTranslation` and the
 *          formatting hooks under it, @stackra/ui's own words included, follow the display switcher live, in the
 *          digits picked in Display (Latin by default).
 * Boundary: mounting only; the locale is the switcher's (the URL), the words are `MESSAGES`. The container boots
 *           once per page load; until it has, the tree renders without the provider and reads English.
 * Runtime: browser
 * Governing contract: ADR 0080; ADR 0295 (decision 7: a stand-in for gen's `Contexts`); ADR 0060 (RTL).
 */
import { buildConfig } from "@stackra/config";
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { I18nConfig, Locale, NumberingSystem } from "@stackra/i18n";
import { I18nProvider, useNumerals } from "@stackra/i18n/react";
import { useEffect, useState } from "react";

import type { ShowcaseI18nProps } from "#src/components/showcase-i18n/showcase-i18n.props";
import { MESSAGES } from "#src/constants/messages.constant";

// shortcut: a container of its own holding only the i18n config, until gen's entry boots the app's (STA-339).
const BOOT = Container.create([], {
  overrides: new Map([
    [
      I18nConfig,
      buildConfig(I18nConfig, {
        // The digits are the viewer's Display choice, as a customer's setting would be (ADR 0192 as amended 2026-10-28).
        values: { locales: [Locale.En, Locale.Ar], scopeChoosesNumerals: true },
      }),
    ],
  ]),
});

/** The booted container once ready, so a render after boot (every one but a cold first) mounts the provider at once. */
let booted: Container | undefined;
void BOOT.then((container) => (booted = container));

/** Provides the picked locale and its catalogues to the tree. */
export function ShowcaseI18n({ locale, numerals, children }: ShowcaseI18nProps) {
  // A nested mount (a hero's side) keeps the digits of the mount around it unless given its own.
  const around = useNumerals();
  const digits = numerals ?? (around === NumberingSystem.User ? undefined : around);
  const [container, setContainer] = useState(() => booted);
  useEffect(() => {
    if (container === undefined) void BOOT.then(setContainer);
  }, [container]);
  if (container === undefined) return children;
  const isArabic = locale.startsWith("ar");
  return (
    <ContainerProvider container={container}>
      <I18nProvider
        locale={isArabic ? Locale.Ar : Locale.En}
        messages={isArabic ? MESSAGES.ar : MESSAGES.en}
        numerals={digits}
      >
        {children}
      </I18nProvider>
    </ContainerProvider>
  );
}
