/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Surface: Pick a level; the surface below repaints and tells you which one it
 *          is.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { SurfaceVariant } from "@stackra/ui/contracts";
import { Button, Surface as UiSurface, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SURFACE_KEYS } from "#src/demos/free/surface/surface-keys.constant";

/** The demo's keys. */
const K = SURFACE_KEYS.surface;

/** The padding and radius every sample adds, since the web surface has neither. */
const BOX = "p-6";

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** Surface: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [level, setLevel] = useState<SurfaceVariant>("secondary");

  return (
    <div className="grid gap-6">
      <ul className={ROW}>
        {SurfaceVariant.map((variant) => (
          <li key={variant}>
            <Button
              variant={variant === level ? "primary" : "secondary"}
              aria-pressed={variant === level}
              onPress={() => setLevel(variant)}
            >
              {t(K.pick, { level: variant })}
            </Button>
          </li>
        ))}
      </ul>
      <UiSurface
        variant={level}
        data-testid="live-surface"
        className={level === "transparent" ? `${BOX} border border-border` : BOX}
      >
        <Text>
          <bdi>{t(K.current, { level })}</bdi>
        </Text>
      </UiSurface>
    </div>
  );
}
