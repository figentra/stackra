/**
 * Stackra file contract:
 * Purpose: `MESSAGES`, the mobile app's catalogues by locale (`en`, `ar`): its own `assets/lang/<locale>/<namespace>.json`
 *          (one namespace per screen plus `shell`) with @stackra/ui's `ui` and
 *          @stackra/showcase's `showcase` (the registry's titles, categories and chrome), each Arabic
 *          namespace merged over its English one, so a key Arabic lacks still reads in English.
 * Boundary: data only. Metro has no glob: a new namespace adds its two imports and its row below. `MESSAGES.en` is also
 *           the English fallback the screens pass to `useCatalogueText`.
 * Runtime: react-native
 * Governing contract: ADR 0080; ADR 0305 (conventions 1: `assets/lang/<locale>/<namespace>.json`); ADR 0403.
 */
import { mergeCatalogues, type Messages } from "@stackra/i18n";
import showcaseAr from "@stackra/showcase/assets/lang/ar/showcase.json";
import showcaseEn from "@stackra/showcase/assets/lang/en/showcase.json";
import uiAr from "@stackra/ui/assets/lang/ar/ui.json";
import uiEn from "@stackra/ui/assets/lang/en/ui.json";

import brandAr from "../../assets/lang/ar/brand.json";
import buttonAr from "../../assets/lang/ar/button.json";
import demoFreeAr from "../../assets/lang/ar/demo_free.json";
import designSystemAr from "../../assets/lang/ar/design_system.json";
import settingsAr from "../../assets/lang/ar/settings.json";
import shellAr from "../../assets/lang/ar/shell.json";
import brandEn from "../../assets/lang/en/brand.json";
import buttonEn from "../../assets/lang/en/button.json";
import demoFreeEn from "../../assets/lang/en/demo_free.json";
import designSystemEn from "../../assets/lang/en/design_system.json";
import settingsEn from "../../assets/lang/en/settings.json";
import shellEn from "../../assets/lang/en/shell.json";

// shortcut: every catalogue imported eagerly until gen writes the `#stackra/i18n` loaders (STA-339); then
// `loadMessages(catalogues, locale)` replaces this file.
const ENGLISH: Messages = {
  shell: shellEn,
  brand: brandEn,
  settings: settingsEn,
  design_system: designSystemEn,
  button: buttonEn,
  demo_free: demoFreeEn,
  showcase: showcaseEn,
  ui: uiEn,
};

const ARABIC: Messages = {
  shell: shellAr,
  brand: brandAr,
  settings: settingsAr,
  design_system: designSystemAr,
  button: buttonAr,
  demo_free: demoFreeAr,
  showcase: showcaseAr,
  ui: uiAr,
};

/** The merged catalogues of each locale the app offers. */
export const MESSAGES: Readonly<{ en: Messages; ar: Messages }> = {
  en: ENGLISH,
  ar: Object.fromEntries(
    Object.entries(ENGLISH).map(([namespace, english]) => [
      namespace,
      mergeCatalogues([english, ARABIC[namespace] ?? {}]),
    ]),
  ),
};
