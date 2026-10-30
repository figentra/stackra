/**
 * Stackra file contract:
 * Purpose: the "context" demo of the native Chip: a chip inside a sentence, and a row of category chips.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Chip, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CHIP_DEMO_KEYS } from "#src/demos/free/chip/chip-demo-keys.constant";

/** The demo's keys. */
const K = CHIP_DEMO_KEYS.demo_free.chip.context;

/** The categories of the row. */
const CATEGORIES = ["design", "engineering", "support"] as const;

/** A status chip in a sentence, then categories. */
export default function Context() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap items-center gap-2">
        <Text>{t(K.sentence_prefix)}</Text>
        <Chip size="sm" tone="success" variant="soft">
          {t(K.sentence_chip)}
        </Chip>
        <Text>{t(K.sentence_suffix)}</Text>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <Chip key={category}>{t(K[category])}</Chip>
        ))}
      </View>
    </View>
  );
}
