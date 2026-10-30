/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web TransferList: the warehouses that stock a product, moved between all
 *          warehouses and the ones chosen, with a note under each.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { TransferList, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { TRANSFER_LIST_KEYS } from "#src/demos/free/transfer-list/transfer-list-keys.constant";

/** The demo's keys. */
const K = TRANSFER_LIST_KEYS.transfer_list.basics;

/** The warehouses, by key. */
const WAREHOUSES = ["riyadh", "jeddah", "dammam", "medina", "dubai", "kuwait"] as const;

/** TransferList: Stock locations. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="w-full max-w-2xl">
      <TransferList
        label={t(K.label)}
        description={t(K.description)}
        availableLabel={t(K.available)}
        chosenLabel={t(K.chosen)}
        defaultValue={["riyadh", "jeddah"]}
        items={WAREHOUSES.map((id) => ({
          id,
          label: t(K[id]),
          description: t(K[`${id}_note`]),
        }))}
      />
    </div>
  );
}
