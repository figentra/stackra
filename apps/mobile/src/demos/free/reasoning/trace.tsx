/**
 * Stackra file contract:
 * Purpose: the "trace" demo of the native Reasoning: an agent's three steps, open, with labels above the first two.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (component gaps, owner approval 2026-10-31).
 */
import { Reasoning, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { REASONING_DEMO_KEYS } from "#src/demos/free/reasoning/reasoning-demo-keys.constant";

/** The demo's keys. */
const K = REASONING_DEMO_KEYS.demo_free.reasoning.trace;

/** Reasoning: an agent's three steps, open, with labels above the first two. */
export default function Trace() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View>
      <Reasoning
        defaultExpanded
        summary={t(K.summary)}
        steps={[
          { key: "search", label: t(K.search_label), content: t(K.search) },
          { key: "compare", label: t(K.compare_label), content: t(K.compare) },
          { key: "check", content: t(K.check) },
        ]}
      />
    </View>
  );
}
