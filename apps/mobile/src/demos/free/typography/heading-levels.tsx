/**
 * Stackra file contract:
 * Purpose: the "heading-levels" demo of the native `Heading`: `level` alone, each level in its own style.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); STA-416 FR-013.
 */
import { HeadingLevel } from "@stackra/ui/contracts";
import { Heading, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TYPOGRAPHY_DEMO_KEYS } from "#src/demos/free/typography/typography-demo-keys.constant";

/** The demo's keys. */
const K = TYPOGRAPHY_DEMO_KEYS.demo_free.typography.heading_levels;

/** One heading per level. */
export default function HeadingLevels() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-2">
      {HeadingLevel.map((level) => (
        <Heading key={level} level={level}>
          {t(K.level, { level })}
        </Heading>
      ))}
    </View>
  );
}
