/**
 * Stackra file contract:
 * Purpose: the "icon-only" demo of the web ShareButton: a product row whose share button is an icon named for the
 *          product.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave C, owner approval 2026-10-29).
 */
import { ShareButton, Text, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { SHARE_BUTTON_KEYS } from "#src/demos/free/share-button/share-button-keys.constant";

/** The demo's keys. */
const K = SHARE_BUTTON_KEYS.share_button.icon_only;

/** ShareButton: Icon only. */
export default function IconOnly() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="flex w-full max-w-sm items-center justify-between gap-3">
      <div className="grid">
        <Text className="font-medium">{t(K.product)}</Text>
        <Text tone="muted" type="small">
          {t(K.price)}
        </Text>
      </div>
      <ShareButton
        isIconOnly
        label={t(K.label)}
        url="https://shop.example/p/linen-abaya"
        title={t(K.product)}
        text={t(K.text)}
      />
    </div>
  );
}
