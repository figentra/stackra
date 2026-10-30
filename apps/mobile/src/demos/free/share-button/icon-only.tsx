/**
 * Stackra file contract:
 * Purpose: the "icon-only" demo of the native ShareButton: a product row whose share button is an icon named for the product.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave C, owner approval 2026-10-29).
 */
import { ShareButton, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SHARE_BUTTON_DEMO_KEYS } from "#src/demos/free/share-button/share-button-demo-keys.constant";

/** The demo's keys. */
const K = SHARE_BUTTON_DEMO_KEYS.demo_free.share_button.icon_only;

/** ShareButton: Icon only. */
export default function IconOnly() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row items-center justify-between gap-3">
      <View>
        <Text className="font-medium">{t(K.product)}</Text>
        <Text tone="muted" type="small">
          {t(K.price)}
        </Text>
      </View>
      <ShareButton
        isIconOnly
        label={t(K.label)}
        url="https://shop.example/p/linen-abaya"
        title={t(K.product)}
        text={t(K.text)}
      />
    </View>
  );
}
