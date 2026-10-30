/**
 * Stackra file contract:
 * Purpose: the "levels" demo of the web Surface: One surface per level. The transparent one draws no background, so
 *          it has a border.
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

/** The Surface demo: levels. */
export default function Levels() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {SurfaceVariant.map((variant) => (
        <UiSurface
          key={variant}
          variant={variant}
          className={variant === "transparent" ? `${BOX} border border-border` : BOX}
        >
          <Text>{t(K.level, { level: variant })}</Text>
          <Text type="small" tone="muted">
            <bdi>{t(K.level_line)}</bdi>
          </Text>
        </UiSurface>
      ))}
    </div>
  );
}
