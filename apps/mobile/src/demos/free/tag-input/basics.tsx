/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Tag input: tag a customer; paste a list to add several at once.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { TagInput, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TAG_INPUT_DEMO_KEYS } from "#src/demos/free/tag-input/tag-input-demo-keys.constant";

/** The demo's keys. */
const K = TAG_INPUT_DEMO_KEYS.demo_free.tag_input.basics;

/** Tag input: tag a customer; paste a list to add several at once. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View>
      <TagInput
        label={t(K.label)}
        description={t(K.hint)}
        placeholder={t(K.placeholder)}
        defaultValue={["VIP", "Wholesale"]}
        maxTags={6}
      />
    </View>
  );
}
