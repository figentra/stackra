/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native TransferList: the warehouses that stock a product, moved between all
 *          warehouses and the ones chosen in two stacked lists.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { TransferList, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TRANSFER_LIST_DEMO_KEYS } from "#src/demos/free/transfer-list/transfer-list-demo-keys.constant";

/** The demo's keys. */
const K = TRANSFER_LIST_DEMO_KEYS.demo_free.transfer_list.basics;

/** The warehouses, by key. */
const WAREHOUSES = ["riyadh", "jeddah", "dammam", "dubai", "kuwait"] as const;

/** TransferList: Stock locations. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <TransferList
      label={t(K.label)}
      availableLabel={t(K.available)}
      chosenLabel={t(K.chosen)}
      defaultValue={["riyadh"]}
      items={WAREHOUSES.map((id) => ({ id, label: t(K[id]) }))}
    />
  );
}
