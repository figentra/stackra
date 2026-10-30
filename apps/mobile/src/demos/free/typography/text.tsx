/**
 * Stackra file contract:
 * Purpose: the "text" demo of the native typography: each `Text` `type` in Latin and in Arabic (`lang="ar"`).
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); STA-416 FR-013.
 */
import { TextType } from "@stackra/ui/contracts";
import { Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { MESSAGES } from "#src/constants/messages.constant";
import { TYPOGRAPHY_DEMO_KEYS } from "#src/demos/free/typography/typography-demo-keys.constant";

/** The demo's keys. */
const K = TYPOGRAPHY_DEMO_KEYS.demo_free.typography.sample;

/** Every type, once per script; the Arabic line takes the theme's Arabic style. */
export default function TextDemo() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      {TextType.map((type) => (
        <Sample key={type} caption={type}>
          <Text type={type}>{t(K.latin)}</Text>
          <Text type={type} lang="ar">
            {t(K.arabic)}
          </Text>
        </Sample>
      ))}
    </View>
  );
}
