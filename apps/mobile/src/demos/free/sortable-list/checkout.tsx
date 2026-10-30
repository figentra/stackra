/**
 * Stackra file contract:
 * Purpose: the "checkout" demo of the native SortableList: checkout steps drawn by `renderItem` with their step number; Payment is locked in the last place.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6);
 *          design-system gap inventory (2026-10-28).
 */
import { SortableList, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SORTABLE_LIST_DEMO_KEYS } from "#src/demos/free/sortable-list/sortable-list-demo-keys.constant";

/** The demo's keys. */
const K = SORTABLE_LIST_DEMO_KEYS.demo_free.sortable_list.checkout;

/** Numbered steps; Payment cannot move. */
export default function Checkout() {
  const t = useCatalogueText(MESSAGES.en);
  const [steps, setSteps] = useState(() => [
    { id: "cart", label: t(K.cart) },
    { id: "address", label: t(K.address) },
    { id: "shipping", label: t(K.shipping) },
    { id: "payment", label: t(K.payment), isDisabled: true },
  ]);
  return (
    <SortableList
      label={t(K.label)}
      items={steps}
      // Payment stays last: a move that would push it up is refused.
      onReorder={(next) => {
        if (next.at(-1)?.id === "payment") setSteps([...next]);
      }}
      renderItem={(step) => (
        <View className="gap-0.5">
          <Text tone="muted">{t(K.step, { number: steps.indexOf(step) + 1 })}</Text>
          <Text>{step.label}</Text>
          {step.isDisabled ? <Text tone="muted">{t(K.locked)}</Text> : null}
        </View>
      )}
    />
  );
}
