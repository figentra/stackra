/**
 * Stackra file contract:
 * Purpose: the "export-columns" demo of the web TransferList: the columns of an orders export, held by the page, with
 *          the order number always included (disabled) and the count written under it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Text, TransferList, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { TRANSFER_LIST_KEYS } from "#src/demos/free/transfer-list/transfer-list-keys.constant";

/** The demo's keys. */
const K = TRANSFER_LIST_KEYS.transfer_list.export_columns;

/** The export's columns, by key. */
const COLUMNS = [
  "number",
  "date",
  "customer",
  "phone",
  "total",
  "tax",
  "payment",
  "status",
  "courier",
] as const;

/** TransferList: Export columns. */
export default function ExportColumns() {
  const t = useCatalogueText(MESSAGES.en);
  const [columns, setColumns] = useState<readonly string[]>([
    "number",
    "date",
    "customer",
    "total",
  ]);
  return (
    <div className="grid w-full max-w-2xl gap-3">
      <TransferList
        label={t(K.label)}
        availableLabel={t(K.available)}
        chosenLabel={t(K.chosen)}
        value={columns}
        onChange={setColumns}
        items={COLUMNS.map((id) => ({
          id,
          label: t(K[id]),
          ...(id === "number" ? { description: t(K.number_note), isDisabled: true } : {}),
        }))}
      />
      <Text tone="muted">{t(K.summary, { count: columns.length })}</Text>
    </div>
  );
}
