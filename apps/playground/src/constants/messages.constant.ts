/**
 * Stackra file contract:
 * Purpose: `MESSAGES`, the playground's catalogues by locale (`en`, `ar`): every `assets/lang/<locale>/<namespace>.json`
 *          of the app (one namespace per route plus `shell`) with @stackra/ui's `ui` and @stackra/showcase's `showcase` (the
 *          component pages' words), each Arabic namespace merged over its English one, so a key Arabic lacks still reads in English.
 * Boundary: data only, loaded eagerly as one module (`virtual:playground-catalogues`, `scripts/catalogues.plugin.ts`). `MESSAGES.en` is also the English fallback the pages pass
 *           to `useCatalogueText`, so a page rendered without the provider (a unit test) reads English.
 * Runtime: browser
 * Governing contract: ADR 0080; ADR 0305 (conventions 1: `assets/lang/<locale>/<namespace>.json`); ADR 0403.
 */
import { mergeCatalogues, type Messages } from "@stackra/i18n";
import showcaseAr from "@stackra/showcase/assets/lang/ar/showcase.json";
import showcaseEn from "@stackra/showcase/assets/lang/en/showcase.json";
import uiAr from "@stackra/ui/assets/lang/ar/ui.json";
import uiEn from "@stackra/ui/assets/lang/en/ui.json";
import CATALOGUES from "virtual:playground-catalogues";

// shortcut: every catalogue in one module (`cataloguesPlugin`, one request on the dev server) until gen writes the
// lazy `#stackra/i18n` loaders (STA-339); then `loadMessages(catalogues, locale)` replaces this file.
/** The app's own catalogues of `locale`, by namespace (the file name). */
const own = (locale: string): Messages => CATALOGUES[locale] ?? {};

const ENGLISH: Messages = { ...own("en"), ui: uiEn, showcase: showcaseEn };
const ARABIC: Messages = { ...own("ar"), ui: uiAr, showcase: showcaseAr };

/** The merged catalogues of each locale the playground offers. */
export const MESSAGES = {
  en: ENGLISH,
  ar: Object.fromEntries(
    Object.entries(ENGLISH).map(([namespace, english]) => [
      namespace,
      mergeCatalogues([english, ARABIC[namespace] ?? {}]),
    ]),
  ) as Messages,
} as const satisfies Record<string, Messages>;
