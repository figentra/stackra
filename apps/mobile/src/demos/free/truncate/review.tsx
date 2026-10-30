/**
 * Stackra file contract:
 * Purpose: the "review" demo of the native Truncate: a customer review clamped to two lines with Show more.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Truncate, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TRUNCATE_DEMO_KEYS } from "#src/demos/free/truncate/truncate-demo-keys.constant";

/** The demo's keys. */
const K = TRUNCATE_DEMO_KEYS.demo_free.truncate.review;

/** Truncate: a customer review clamped to two lines with Show more. */
export default function Review() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View>
      <Truncate lines={2}>{t(K.text)}</Truncate>
    </View>
  );
}
