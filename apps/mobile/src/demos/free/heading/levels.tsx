/**
 * Stackra file contract:
 * Purpose: the "levels" demo of the native Heading: one heading per level, each drawn in its level's look.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); STA-1371.
 */
import { HeadingLevel } from "@stackra/ui/contracts";
import { Heading, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { HEADING_DEMO_KEYS } from "#src/demos/free/heading/heading-demo-keys.constant";

/** The demo's keys. */
const K = HEADING_DEMO_KEYS.demo_free.heading.sample;

/** Each heading level, from largest to smallest, with its number. */
export default function Levels() {
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
