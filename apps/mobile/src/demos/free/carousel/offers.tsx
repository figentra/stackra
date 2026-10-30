/**
 * Stackra file contract:
 * Purpose: the "offers" demo of the native Carousel: this week's offers.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (wave 3b).
 */
import { Carousel, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CAROUSEL_DEMO_KEYS } from "#src/demos/free/carousel/carousel-demo-keys.constant";

/** The demo's keys. */
const K = CAROUSEL_DEMO_KEYS.demo_free.carousel.offers;

/** Three offers, one at a time. */
export default function Offers() {
  const t = useCatalogueText(MESSAGES.en);
  const slides = [
    ["one", "one_note", "bg-accent-soft"],
    ["two", "two_note", "bg-surface-secondary"],
    ["three", "three_note", "bg-default"],
  ] as const;
  return (
    <Carousel label={t(K.label)}>
      {slides.map(([title, note, surface]) => (
        <View key={title} className={`h-40 justify-end gap-1 rounded-xl p-5 ${surface}`}>
          <Text className="text-lg font-semibold">{t(K[title])}</Text>
          <Text type="small" tone="muted">
            {t(K[note])}
          </Text>
        </View>
      ))}
    </Carousel>
  );
}
