/**
 * Stackra file contract:
 * Purpose: the "inline" demo of the native `Text`: a `Text` nested inside a sentence, and small muted text.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); STA-416 FR-013.
 */
import { Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TYPOGRAPHY_DEMO_KEYS } from "#src/demos/free/typography/typography-demo-keys.constant";

/** The demo's keys. */
const K = TYPOGRAPHY_DEMO_KEYS.demo_free.typography.inline;

/** A nested accent run, then the secondary line of a list. */
export default function Inline() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-2">
      <Text>
        {t(K.before)}
        <Text tone="accent">{t(K.inline)}</Text>
        {t(K.after)}
      </Text>
      <Text type="small" tone="muted">
        {t(K.small)}
      </Text>
    </View>
  );
}
