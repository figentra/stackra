/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native BrandLogo block (@stackra/theming): a logo for each scheme that follows the
 *          app's light or dark look, and the brand name as the fallback where there is no logo.
 * Boundary: a demo with no props: the kit block and a container of its own that binds a `ColorSchemeService`, as an
 *           app's root would; the scheme drawn is the app's own (`mode`). Every word from the catalogue. The logos are
 *           one-pixel PNGs, so the demo never touches the network; React Native's Image draws no SVG. The same file is
 *           the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); ADR 0504 (module UI kits).
 */
import { Container } from "@stackra/container";
import type { Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { ColorSchemeService } from "@stackra/theming";
import { BrandLogo } from "@stackra/theming/native";
import { fakeColorScheme } from "@stackra/theming/testing";
import { Text, useCatalogueText, useDesignSystem } from "@stackra/ui/native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { BRAND_LOGO_DEMO_KEYS } from "#src/demos/free/brand-logo/brand-logo-demo-keys.constant";

/** The demo's keys. */
const K = BRAND_LOGO_DEMO_KEYS.demo_free.brand_logo.basics;

/** One logo per scheme: one-pixel PNGs, the picture's own colours, not interface colours. */
const LOGO = {
  light:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNIKekGAAKjAWRgxqrsAAAAAElFTkSuQmCC",
  dark: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGO42ekFAAPrAa2rQs6bAAAAAElFTkSuQmCC",
};

/** The demo's container, booted once: the scheme service an app's root binds. */
const BOOT = Container.create([], {
  overrides: new Map<Token, object>([[ColorSchemeService, fakeColorScheme()]]),
});

/** Brand logo: a logo per scheme, and the fallback without one. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const { resolvedColorScheme } = useDesignSystem();
  const [container, setContainer] = useState<Container | undefined>(undefined);
  useEffect(() => void BOOT.then(setContainer), []);
  if (container === undefined) return null;
  return (
    <ContainerProvider container={container}>
      <View className="gap-4">
        <View className="flex-row items-center gap-3">
          <BrandLogo logo={LOGO} mode={resolvedColorScheme} label={t(K.brand)} />
          <Text>{t(K.with_logo)}</Text>
        </View>
        <View className="flex-row items-center gap-3">
          <BrandLogo fallback={<Text>{t(K.brand)}</Text>} />
          <Text type="small" tone="muted">
            {t(K.without_logo)}
          </Text>
        </View>
      </View>
    </ContainerProvider>
  );
}
