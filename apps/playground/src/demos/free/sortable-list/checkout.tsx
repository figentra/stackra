/**
 * Stackra file contract:
 * Purpose: the "checkout" demo of the web Sortable list: checkout steps drawn by `renderItem` with their step number; Payment is locked in the last place.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          design-system gap inventory (2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { SortableList, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SORTABLE_LIST_KEYS } from "#src/demos/free/sortable-list/sortable-list-keys.constant";

/** The demo's keys. */
const K = SORTABLE_LIST_KEYS.sortable_list.checkout;

/** Sortable list: Custom rows. */
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
      className="max-w-md"
      renderItem={(step) => (
        <div className="flex items-baseline gap-3">
          <Text tone="muted">{t(K.step, { number: steps.indexOf(step) + 1 })}</Text>
          <span>{step.label}</span>
          {step.isDisabled ? <Text tone="muted">{t(K.locked)}</Text> : null}
        </div>
      )}
    />
  );
}
