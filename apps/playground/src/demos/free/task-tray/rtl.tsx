/**
 * Stackra file contract:
 * Purpose: the "rtl" demo of the web TaskTray: the tray in a right-to-left Arabic block: marks and names read from
 *          the right, the buttons sit at the left end, and bars fill from the right.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (RTL); STA-1371.
 */
import { TaskTray, useCatalogueText } from "@stackra/ui/react";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { TASK_TRAY_KEYS } from "#src/demos/free/task-tray/task-tray-keys.constant";

/** The demo's keys. */
const K = TASK_TRAY_KEYS.task_tray.rtl;

/** TaskTray: right to left. */
export default function Rtl() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div dir="rtl" lang="ar" className="w-full max-w-md">
      <TaskTray
        placement="inline"
        // An Arabic name for the Arabic block, and one that differs from the states demo's default on the same page.
        label={t(K.label)}
        onCancel={() => undefined}
        onRetry={() => undefined}
        onDismiss={() => undefined}
        tasks={[
          {
            id: "export",
            label: t(K.export),
            status: "running",
            progress: 40,
            icon: Icons.Download,
          },
          { id: "import", label: t(K.import), status: "error", detail: t(K.no_phone) },
          { id: "upload", label: t(K.upload), status: "done" },
        ]}
      />
    </div>
  );
}
