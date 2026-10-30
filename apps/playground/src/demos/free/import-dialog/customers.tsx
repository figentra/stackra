/**
 * Stackra file contract:
 * Purpose: the "customers" demo of the web ImportDialog: import a customer list: drop the file (or download the
 *          template), match its columns, review the dry run, import.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           The file is not parsed here: `onRead` answers with a fixed header, as the app's reader would.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (owner request 2026-10-29).
 */
import { Button, ImportDialog, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { IMPORT_DIALOG_KEYS } from "#src/demos/free/import-dialog/import-dialog-keys.constant";

/** The demo's keys. */
const K = IMPORT_DIALOG_KEYS.import_dialog;

/** The template people start from: the header row only. */
const TEMPLATE = `data:text/csv;charset=utf-8,${encodeURIComponent("Full Name,E-mail,Mobile,City\r\n")}`;

/** Waits `ms`, as a server round trip would. */
const later = <T,>(ms: number, value: T) =>
  new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), ms);
  });

/** Import dialog: Customers. */
export default function Customers() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ImportDialog
      trigger={<Button variant="secondary">{t(K.open)}</Button>}
      description={t(K.description)}
      templateUrl={TEMPLATE}
      fields={[
        { key: "name", label: t(K.name), isRequired: true, aliases: ["full name"] },
        { key: "email", label: t(K.email), isRequired: true, aliases: ["e-mail"] },
        { key: "phone", label: t(K.phone), aliases: ["mobile"] },
        { key: "city", label: t(K.city) },
      ]}
      onRead={() =>
        later(600, {
          columns: ["Full Name", "E-mail", "Mobile", "City", "Notes"],
          sample: {
            "Full Name": "Sara Ali",
            "E-mail": "sara@example.com",
            Mobile: "+966 50 123 4567",
            City: "Riyadh",
            Notes: "VIP",
          },
          rowCount: 208,
        })
      }
      onDryRun={() => later(700, { created: 182, updated: 24, skipped: 2, failed: 0, issues: [] })}
      onImport={() => later(1200, undefined)}
    />
  );
}
