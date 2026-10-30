/**
 * Stackra file contract:
 * Purpose: the "nested" demo of the web Surface: Default, then secondary inside it, then tertiary inside that.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Surface as UiSurface, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SURFACE_KEYS } from "#src/demos/free/surface/surface-keys.constant";

/** The demo's keys. */
const K = SURFACE_KEYS.surface;

/** The padding and radius every sample adds, since the web surface has neither. */
const BOX = "p-6";

/** The Surface demo: nested. */
export default function Nested() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <UiSurface variant="default" className={BOX}>
      <Text>{t(K.level, { level: "default" })}</Text>
      <UiSurface variant="secondary" className={`${BOX} mt-4`}>
        <Text>{t(K.level, { level: "secondary" })}</Text>
        <UiSurface variant="tertiary" className={`${BOX} mt-4`}>
          <Text>{t(K.level, { level: "tertiary" })}</Text>
        </UiSurface>
      </UiSurface>
    </UiSurface>
  );
}
