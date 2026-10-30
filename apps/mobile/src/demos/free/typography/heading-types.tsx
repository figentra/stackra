/**
 * Stackra file contract:
 * Purpose: the "heading-types" demo of the native `Heading`: a level-3 heading drawn in every `type`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); STA-416 FR-013.
 */
import { HeadingType } from "@stackra/ui/contracts";
import { Heading, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { MESSAGES } from "#src/constants/messages.constant";
import { TYPOGRAPHY_DEMO_KEYS } from "#src/demos/free/typography/typography-demo-keys.constant";

/** The demo's keys. */
const K = TYPOGRAPHY_DEMO_KEYS.demo_free.typography.sample;

/** The level stays 3 for screen readers; only the style changes. */
export default function HeadingTypes() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      {HeadingType.map((type) => (
        <Sample key={type} caption={type}>
          <Heading level={3} type={type}>
            {t(K.latin)}
          </Heading>
        </Sample>
      ))}
    </View>
  );
}
