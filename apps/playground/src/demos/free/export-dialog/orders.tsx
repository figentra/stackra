/**
 * Stackra file contract:
 * Purpose: the "orders" demo of the web ExportDialog: export the orders list from the admin: CSV, Excel or PDF, the selected, filtered or all rows, and the columns.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); GAPS.md row 16 (owner decision 2026-10-28).
 */
import type { ExportRequest } from "@stackra/ui/contracts";
import { Button, ExportDialog, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { EXPORT_DIALOG_KEYS } from "#src/demos/free/export-dialog/export-dialog-keys.constant";

/** The demo's keys. */
const K = EXPORT_DIALOG_KEYS.export_dialog;

/** The row count of each scope, as the orders table would report it. */
const COUNTS = { selection: 12, filtered: 248, all: 18_432 } as const;

/** How long the sample export takes, in milliseconds. */
// oxlint-disable-next-line stackra/no-literal-duration -- a demo's fake export job, not motion
const EXPORT_MS = 1200;

/** Export dialog: Orders. */
export default function Orders() {
  const t = useCatalogueText(MESSAGES.en);
  const [last, setLast] = useState<ExportRequest | undefined>(undefined);
  return (
    <div className="grid justify-items-start gap-3">
      <ExportDialog
        trigger={<Button variant="secondary">{t(K.open)}</Button>}
        description={t(K.orders.description)}
        formats={[
          { value: "csv", label: t(K.csv) },
          { value: "xlsx", label: t(K.xlsx) },
          { value: "pdf", label: t(K.pdf) },
        ]}
        columns={[
          { value: "number", label: t(K.orders.number) },
          { value: "customer", label: t(K.orders.customer) },
          { value: "branch", label: t(K.orders.branch) },
          { value: "total", label: t(K.orders.total) },
          { value: "status", label: t(K.orders.status) },
          { value: "paid_at", label: t(K.orders.paid_at) },
        ]}
        counts={COUNTS}
        onExport={(request) =>
          new Promise<void>((resolve) => {
            setTimeout(resolve, EXPORT_MS);
          }).then(() => setLast(request))
        }
      />
      {last === undefined ? null : (
        <Text tone="muted" aria-live="polite">
          {t(K.last_export, { format: last.format.toUpperCase(), count: COUNTS[last.scope] })}
        </Text>
      )}
    </div>
  );
}
