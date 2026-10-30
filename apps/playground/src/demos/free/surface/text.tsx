/**
 * Stackra file contract:
 * Purpose: the "text" demo of the web Surface: Default and muted text on every level, the pairs the theme measures.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { SurfaceVariant } from "@stackra/ui/contracts";
import { Surface as UiSurface, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SURFACE_KEYS } from "#src/demos/free/surface/surface-keys.constant";

/** The demo's keys. */
const K = SURFACE_KEYS.surface;

/** The padding and radius every sample adds, since the web surface has neither. */
const BOX = "p-6";

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** Surface: Text on each level. */
export default function TextDemo() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className={ROW}>
      {SurfaceVariant.filter((variant) => variant !== "transparent").map((variant) => (
        <UiSurface key={variant} variant={variant} className={BOX}>
          <Text>
            <bdi>{t(K.default_text)}</bdi>
          </Text>
          <Text tone="muted">
            <bdi>{t(K.muted_text)}</bdi>
          </Text>
        </UiSurface>
      ))}
    </div>
  );
}
