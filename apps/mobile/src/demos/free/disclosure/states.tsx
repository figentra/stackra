/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native Disclosure: a section that starts open and one that is refused.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave C).
 */
import { Disclosure, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DISCLOSURE_DEMO_KEYS } from "#src/demos/free/disclosure/disclosure-demo-keys.constant";

/** The demo's keys. */
const K = DISCLOSURE_DEMO_KEYS.demo_free.disclosure.states;

/** Disclosure: open at first, and disabled. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-2">
      <Disclosure title={t(K.advanced)} defaultExpanded>
        {t(K.advanced_body)}
      </Disclosure>
      <Disclosure title={t(K.locked)} isDisabled>
        {t(K.locked_body)}
      </Disclosure>
    </View>
  );
}
