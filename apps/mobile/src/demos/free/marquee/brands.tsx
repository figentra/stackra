/**
 * Stackra file contract:
 * Purpose: the "brands" demo of the native Marquee: the shop's brand names as a scrolling strip with a pause button.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Marquee, Text, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { MARQUEE_DEMO_KEYS } from "#src/demos/free/marquee/marquee-demo-keys.constant";

/** The demo's keys. */
const K = MARQUEE_DEMO_KEYS.demo_free.marquee.brands;

/** The brands, in order. */
const BRANDS = [K.brand_1, K.brand_2, K.brand_3, K.brand_4, K.brand_5, K.brand_6];

/** Marquee: Brands we carry. */
export default function Brands() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Marquee label={t(K.label)}>
      {BRANDS.map((brand) => (
        <Text key={brand} tone="muted" className="text-lg font-semibold">
          {t(brand)}
        </Text>
      ))}
    </Marquee>
  );
}
