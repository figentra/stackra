/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native ShareButton: an order's receipt link, shared through the system sheet, with a line once it is shared.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave C, owner approval 2026-10-29).
 */
import { ShareButton, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SHARE_BUTTON_DEMO_KEYS } from "#src/demos/free/share-button/share-button-demo-keys.constant";

/** The demo's keys. */
const K = SHARE_BUTTON_DEMO_KEYS.demo_free.share_button.basics;

/** The receipt's link (a link, never translated). */
const RECEIPT = "https://shop.example/r/2048";

/** Shares a receipt link and says when it was shared. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [isShared, setIsShared] = useState(false);
  return (
    <View className="items-start gap-3">
      <ShareButton
        url={RECEIPT}
        title={t(K.title)}
        text={t(K.text)}
        onShare={() => setIsShared(true)}
      />
      {isShared ? <Text tone="muted">{t(K.shared)}</Text> : null}
    </View>
  );
}
