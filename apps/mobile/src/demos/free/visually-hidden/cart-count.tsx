/**
 * Stackra file contract:
 * Purpose: the "cart-count" demo of the native VisuallyHidden: a POS cart row whose bare number is read as
 *          "3 items in the cart", in the reader's language and plural.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); ADR 0060.
 */
import { Button, Chip, Text, useCatalogueText, VisuallyHidden } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { VISUALLY_HIDDEN_DEMO_KEYS } from "#src/demos/free/visually-hidden/visually-hidden-demo-keys.constant";

/** The demo's keys. */
const K = VISUALLY_HIDDEN_DEMO_KEYS.demo_free.visually_hidden.cart_count;

/** A count chip that screen readers hear as a sentence. */
export default function CartCount() {
  const t = useCatalogueText(MESSAGES.en);
  const [count, setCount] = useState(3);
  return (
    <View className="gap-3">
      <View accessible className="flex-row items-center gap-2">
        <Text>{t(K.cart)}</Text>
        <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Chip size="sm" tone="accent" variant="soft">
            {String(count)}
          </Chip>
        </View>
        <VisuallyHidden accessibilityLiveRegion="polite">
          {t(K.items_in_cart, { count })}
        </VisuallyHidden>
      </View>
      <View className="flex-row">
        <Button size="sm" variant="secondary" onPress={() => setCount(count + 1)}>
          {t(K.add_item)}
        </Button>
      </View>
    </View>
  );
}
