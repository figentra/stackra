/**
 * Stackra file contract:
 * Purpose: the "affixes" demo of the native InputGroup: muted text affixes that pass a press to the input.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { InputGroup, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { INPUT_GROUP_DEMO_KEYS } from "#src/demos/free/input-group/input-group-demo-keys.constant";

/** The demo's keys. */
const K = INPUT_GROUP_DEMO_KEYS.demo_free.input_group.affixes;

/** A prefix, a suffix, and both. */
export default function Affixes() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <InputGroup label={t(K.prefix_only)} prefix="/" defaultValue="about-us" />
      <InputGroup label={t(K.suffix_only)} suffix="kg" defaultValue="12" />
      <InputGroup label={t(K.both)} prefix="€" suffix="EUR" defaultValue="49.00" />
    </View>
  );
}
