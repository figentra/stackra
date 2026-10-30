/**
 * Stackra file contract:
 * Purpose: the "order-number" demo of the web CopyButton: an order number to read out or paste into a support chat.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); design-system gap inventory row 35.
 */
import { CopyButton, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { COPY_BUTTON_KEYS } from "#src/demos/free/copy-button/copy-button-keys.constant";

/** The demo's keys. */
const K = COPY_BUTTON_KEYS.copy_button;

/** An order number (data, never translated). */
const ORDER = "ORD-2048-RUH";

/** CopyButton: Order number. */
export default function OrderNumber() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="flex items-center gap-2">
      <Text tone="muted">{t(K.order)}</Text>
      <Text dir="ltr" className="font-mono">
        {ORDER}
      </Text>
      <CopyButton value={ORDER} size="sm" label={t(K.copy_order)} copiedLabel={t(K.order_copied)} />
    </div>
  );
}
