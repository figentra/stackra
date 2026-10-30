/**
 * Stackra file contract:
 * Purpose: the "terms" demo of the native Highlight: two terms marked in one sentence.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Highlight, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { HIGHLIGHT_DEMO_KEYS } from "#src/demos/free/highlight/highlight-demo-keys.constant";

/** The demo's keys. */
const K = HIGHLIGHT_DEMO_KEYS.demo_free.highlight.terms;

/** Highlight: two terms marked in one sentence. */
export default function Terms() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View>
      <Highlight query={[t(K.a), t(K.b)]}>{t(K.text)}</Highlight>
    </View>
  );
}
