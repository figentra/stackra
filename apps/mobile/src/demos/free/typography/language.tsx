/**
 * Stackra file contract:
 * Purpose: the "language" demo of the native typography: text marked with its own `lang` takes that language's style.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); STA-416 FR-013.
 */
import { Heading, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TYPOGRAPHY_DEMO_KEYS } from "#src/demos/free/typography/typography-demo-keys.constant";

/** The demo's keys. */
const K = TYPOGRAPHY_DEMO_KEYS.demo_free.typography.sample;

/** The same style choice whatever the page direction. */
export default function Language() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-2">
      <Text lang="en">{t(K.latin)}</Text>
      <Text lang="ar">{t(K.arabic)}</Text>
      <Heading level={3} lang="ar">
        {t(K.arabic)}
      </Heading>
    </View>
  );
}
