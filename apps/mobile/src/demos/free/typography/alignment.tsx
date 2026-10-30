/**
 * Stackra file contract:
 * Purpose: the "alignment" demo of the native `Text`: `align`; start and end follow the direction, `justify` is iOS-only.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); STA-416 FR-013.
 */
import { TextAlign } from "@stackra/ui/contracts";
import { Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { MESSAGES } from "#src/constants/messages.constant";
import { TYPOGRAPHY_DEMO_KEYS } from "#src/demos/free/typography/typography-demo-keys.constant";

/** The demo's keys. */
const K = TYPOGRAPHY_DEMO_KEYS.demo_free.typography.sample;

/** One long sentence per alignment; switch to Arabic to see start and end swap. */
export default function Alignment() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      {TextAlign.map((align) => (
        <Sample key={align} caption={align}>
          <Text align={align} className="w-full">
            {t(K.long)}
          </Text>
        </Sample>
      ))}
    </View>
  );
}
