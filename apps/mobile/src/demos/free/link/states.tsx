/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native Link: `isDisabled`, press only (no `href`), and a more specific `label`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Link, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { LINK_DEMO_KEYS } from "#src/demos/free/link/link-demo-keys.constant";

/** The demo's keys. */
const K = LINK_DEMO_KEYS.demo_free.link.states;

/** Disabled, a press counter, and a labelled link. */
export default function States() {
  const [presses, setPresses] = useState(0);
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start gap-3">
      <Link href="https://heroui.com" isDisabled>
        {t(K.disabled)}
      </Link>
      <View className="flex-row flex-wrap items-center gap-3">
        <Link onPress={() => setPresses((count) => count + 1)}>{t(K.press)}</Link>
        <Text tone="muted" accessibilityLiveRegion="polite">
          {t(K.presses, { count: presses })}
        </Text>
      </View>
      <Link href="https://heroui.com" label={t(K.label)}>
        {t(K.labelled)}
      </Link>
    </View>
  );
}
