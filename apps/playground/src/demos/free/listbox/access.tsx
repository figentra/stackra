/**
 * Stackra file contract:
 * Purpose: the "access" demo of the web Listbox: a cashier's permissions, grouped by area.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Listbox, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { LISTBOX_KEYS } from "#src/demos/free/listbox/listbox-keys.constant";

/** The demo's keys. */
const K = LISTBOX_KEYS.listbox.access;

/** Listbox: a cashier's permissions, grouped by area. */
export default function Access() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Listbox
      className="w-full max-w-xs"
      label={t(K.label)}
      selectionMode="multiple"
      defaultValue={["view_orders", "refund"]}
      sections={[
        {
          id: "orders",
          title: t(K.orders),
          items: [
            { id: "view_orders", label: t(K.view_orders) },
            { id: "edit_orders", label: t(K.edit_orders) },
            { id: "refund", label: t(K.refund) },
          ],
        },
        {
          id: "catalogue",
          title: t(K.catalogue),
          items: [
            { id: "edit_prices", label: t(K.edit_prices) },
            { id: "publish", label: t(K.publish) },
          ],
        },
      ]}
    />
  );
}
