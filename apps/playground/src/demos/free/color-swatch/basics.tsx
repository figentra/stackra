/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web ColorSwatch: the three sizes, then a small palette with each colour named,
 *          a half-transparent colour on the checkered ground, and the theme's accent read from its token.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); WCAG 2.2 SC 1.1.1; STA-1981.
 */
import { ColorSwatch, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { COLOR_SWATCH_KEYS } from "#src/demos/free/color-swatch/color-swatch-keys.constant";

/** The demo's keys. */
const K = COLOR_SWATCH_KEYS.color_swatch.basics;

/** The row that lays the swatches out, wrapping on a narrow frame. */
const ROW = "flex flex-wrap items-center gap-3";

/** Colour swatch: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  // The colours are the data shown, never theme colours; the last one is the theme's own accent.
  const palette = [
    { color: "#0485f7", label: t(K.ocean) },
    { color: "#d9c9a3", label: t(K.sand) },
    { color: "#1f7a4d", label: t(K.forest) },
    { color: "#c0263f", label: t(K.ruby) },
    { color: "rgba(4, 133, 247, 0.4)", label: t(K.ocean_faded) },
    { color: "var(--accent)", label: t(K.accent) },
  ];
  return (
    <div className="grid gap-4">
      <div className={ROW}>
        {(["sm", "md", "lg"] as const).map((size) => (
          <ColorSwatch key={size} color="#0485f7" label={t(K.ocean)} size={size} />
        ))}
      </div>
      <div className={ROW}>
        {palette.map((swatch) => (
          <ColorSwatch key={swatch.color} color={swatch.color} label={swatch.label} size="lg" />
        ))}
      </div>
    </div>
  );
}
