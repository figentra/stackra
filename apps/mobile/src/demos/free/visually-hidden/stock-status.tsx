/**
 * Stackra file contract:
 * Purpose: the "stock-status" demo of the native VisuallyHidden: product rows whose stock is a coloured icon on screen
 *          and a word to a screen reader, so colour is never the only signal.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); ADR 0060.
 */
import { Icon, Text, useCatalogueText, VisuallyHidden } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { VISUALLY_HIDDEN_DEMO_KEYS } from "#src/demos/free/visually-hidden/visually-hidden-demo-keys.constant";

/** The demo's keys. */
const K = VISUALLY_HIDDEN_DEMO_KEYS.demo_free.visually_hidden.stock_status;

/** Each product's stock, its word and its tone; the icon's shape follows the tone. */
const ROWS = [
  { sku: "SKU-101", status: K.in_stock, tone: "success" },
  { sku: "SKU-102", status: K.low_stock, tone: "warning" },
  { sku: "SKU-103", status: K.out_of_stock, tone: "danger" },
] as const;

/** An icon for the eye, a word for the ear. */
export default function StockStatus() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-2">
      {ROWS.map(({ sku, status, tone }) => (
        <View key={sku} accessible className="flex-row items-center gap-3">
          <Icon
            name={
              tone === "success"
                ? "circle-check"
                : tone === "warning"
                  ? "triangle-alert"
                  : "circle-alert"
            }
            tone={tone}
            size="sm"
          />
          <Text>
            {t(K.product, { sku })}
            <VisuallyHidden>{t(status)}</VisuallyHidden>
          </Text>
        </View>
      ))}
    </View>
  );
}
