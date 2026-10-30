/**
 * Stackra file contract:
 * Purpose: the "large" demo of the web ImportDialog: a 48,210-row catalogue: the import reports its progress, the
 *          bar fills, then the summary shows the final counts.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (owner request 2026-10-29).
 */
import { Button, ImportDialog, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { IMPORT_DIALOG_KEYS } from "#src/demos/free/import-dialog/import-dialog-keys.constant";

/** The demo's keys. */
const K = IMPORT_DIALOG_KEYS.import_dialog;

/** The rows in the sample file. */
const ROWS = 48_210;

/** Waits `ms`, as a server round trip would. */
const later = <T,>(ms: number, value: T) =>
  new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), ms);
  });

/** Import dialog: Large file with progress. */
export default function Large() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ImportDialog
      trigger={<Button variant="secondary">{t(K.large.open)}</Button>}
      description={t(K.large.description)}
      fields={[
        { key: "sku", label: t(K.large.sku), isRequired: true },
        { key: "name", label: t(K.large.product), isRequired: true, aliases: ["title"] },
        { key: "price", label: t(K.large.price), isRequired: true },
        { key: "stock", label: t(K.large.stock), aliases: ["qty"] },
      ]}
      onRead={() =>
        later(800, {
          columns: ["SKU", "Title", "Price", "Qty"],
          sample: { SKU: "TEA-0042", Title: "Saffron tea, 250 g", Price: "39.00", Qty: "120" },
          rowCount: ROWS,
        })
      }
      onDryRun={() =>
        later(900, { created: 1204, updated: 46_880, skipped: 126, failed: 0, issues: [] })
      }
      onImport={(_mapping, progress) =>
        new Promise((resolve) => {
          let done = 0;
          const tick = setInterval(() => {
            done = Math.min(ROWS, done + 4000);
            progress(done / ROWS);
            if (done === ROWS) {
              clearInterval(tick);
              resolve(undefined);
            }
          }, 250);
        })
      }
    />
  );
}
