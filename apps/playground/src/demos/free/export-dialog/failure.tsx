/**
 * Stackra file contract:
 * Purpose: the "failure" demo of the web ExportDialog: the first export fails and the dialog stays open with an error; the second succeeds.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); GAPS.md row 16 (owner decision 2026-10-28).
 */
import { Button, ExportDialog, useCatalogueText } from "@stackra/ui/react";
import { useRef } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { EXPORT_DIALOG_KEYS } from "#src/demos/free/export-dialog/export-dialog-keys.constant";

/** The demo's keys. */
const K = EXPORT_DIALOG_KEYS.export_dialog;

/** Export dialog: Failure and retry. */
export default function Failure() {
  const t = useCatalogueText(MESSAGES.en);
  const attempts = useRef(0);
  return (
    <ExportDialog
      trigger={<Button variant="secondary">{t(K.failed_once)}</Button>}
      formats={[
        { value: "csv", label: t(K.csv) },
        { value: "pdf", label: t(K.pdf) },
      ]}
      counts={{ all: 96 }}
      onExport={() => {
        attempts.current += 1;
        return new Promise<void>((resolve, reject) => {
          setTimeout(
            attempts.current % 2 === 1 ? () => reject(new Error("timeout")) : resolve,
            800,
          );
        });
      }}
    />
  );
}
