/**
 * Stackra file contract:
 * Purpose: the "orders" demo of the native ExportDialog: the orders table's export: three formats, six columns and the selection, filtered or all rows, then a line naming what was exported.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave C, owner approval 2026-10-29).
 */
import type { ExportRequest } from "@stackra/ui/contracts";
import { Button, ExportDialog, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { EXPORT_DIALOG_DEMO_KEYS } from "#src/demos/free/export-dialog/export-dialog-demo-keys.constant";

/** The demo's keys. */
const K = EXPORT_DIALOG_DEMO_KEYS.demo_free.export_dialog;

/** The row count of each scope, as the orders table would report it. */
const COUNTS = { selection: 12, filtered: 248, all: 18_432 } as const;

/** Export dialog: Orders. */
export default function Orders() {
  const t = useCatalogueText(MESSAGES.en);
  const [last, setLast] = useState<ExportRequest | undefined>(undefined);
  return (
    <View className="items-start gap-3">
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
            setTimeout(resolve, 1200);
          }).then(() => setLast(request))
        }
      />
      {last === undefined ? null : (
        <Text tone="muted">
          {t(K.last_export, { format: last.format.toUpperCase(), count: COUNTS[last.scope] })}
        </Text>
      )}
    </View>
  );
}
