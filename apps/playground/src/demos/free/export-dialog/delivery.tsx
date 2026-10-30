/**
 * Stackra file contract:
 * Purpose: the "delivery" demo of the web ExportDialog: a large product catalogue, with Arabic names, sent by email instead of downloaded.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); GAPS.md row 16 (owner decision 2026-10-28).
 */
import { Button, ExportDialog, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { EXPORT_DIALOG_KEYS } from "#src/demos/free/export-dialog/export-dialog-keys.constant";

/** The demo's keys. */
const K = EXPORT_DIALOG_KEYS.export_dialog;

/** The sample merchant's address (an address, never translated). */
const EMAIL = "ops@figentra.com";

/** Export dialog: Email delivery. */
export default function Delivery() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ExportDialog
      trigger={<Button variant="secondary">{t(K.products.open)}</Button>}
      description={t(K.products.description)}
      formats={[
        { value: "xlsx", label: t(K.xlsx) },
        { value: "csv", label: t(K.csv) },
      ]}
      columns={[
        { value: "sku", label: t(K.products.sku) },
        { value: "name", label: t(K.products.name) },
        { value: "name_ar", label: t(K.products.name_ar) },
        { value: "price", label: t(K.products.price) },
        { value: "stock", label: t(K.products.stock) },
      ]}
      counts={{ filtered: 3120, all: 41_870 }}
      deliveries={["download", "email"]}
      email={EMAIL}
      defaultValue={{ delivery: "email" }}
      onExport={() =>
        new Promise<void>((resolve) => {
          setTimeout(resolve, 900);
        })
      }
    />
  );
}
