/**
 * Stackra file contract:
 * Purpose: the "brands" demo of the web Marquee: the shop's brand names as a scrolling strip, paused on hover, focus
 *          or with its button.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Marquee, Text, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { MARQUEE_KEYS } from "#src/demos/free/marquee/marquee-keys.constant";

/** The demo's keys. */
const K = MARQUEE_KEYS.marquee.brands;

/** The brands, in order. */
const BRANDS = [K.brand_1, K.brand_2, K.brand_3, K.brand_4, K.brand_5, K.brand_6];

/** Marquee: Brands we carry. */
export default function Brands() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Marquee label={t(K.label)} className="w-full max-w-2xl">
      {BRANDS.map((brand) => (
        <Text key={brand} className="text-lg font-semibold whitespace-nowrap text-muted">
          {t(brand)}
        </Text>
      ))}
    </Marquee>
  );
}
