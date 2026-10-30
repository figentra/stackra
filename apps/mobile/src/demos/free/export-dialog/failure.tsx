/**
 * Stackra file contract:
 * Purpose: the "failure" demo of the native ExportDialog: an export that fails on the first try and succeeds on the next, so the failure and the retry show.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave C, owner approval 2026-10-29).
 */
import { Button, ExportDialog, useCatalogueText } from "@stackra/ui/native";
import { useRef } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { EXPORT_DIALOG_DEMO_KEYS } from "#src/demos/free/export-dialog/export-dialog-demo-keys.constant";

/** The demo's keys. */
const K = EXPORT_DIALOG_DEMO_KEYS.demo_free.export_dialog;

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
