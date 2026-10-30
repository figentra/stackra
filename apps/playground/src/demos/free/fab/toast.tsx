/**
 * Stackra file contract:
 * Purpose: the "toast" demo of the web Floating action button: an area with a floating Fab and a Save button whose
 *          toast, on a phone-width screen, rises above the Fab instead of covering it. The lift is the ToastProvider's
 *          own while a floating Fab is on screen; nothing here positions the toast.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown. It mounts the
 *           page's ToastProvider for its own toasts (the page mounts none, and this example is drawn once).
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (FAB toast); ADR 0060
 *          (light, dark, RTL).
 */
import { Button, Fab, Text, ToastProvider, toast, useCatalogueText } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { FAB_KEYS } from "#src/demos/free/fab/fab-keys.constant";

/** The demo's keys. */
const K = FAB_KEYS.fab;

/** Floating action button: Beside a toast. */
export default function Toast(): ReactElement {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="relative grid h-56 w-full content-start gap-3 rounded-[var(--radius-container)] border border-dashed border-border p-4">
      <Text type="small" tone="muted">
        <bdi>{t(K.toast_hint)}</bdi>
      </Text>
      <div>
        <Button variant="secondary" onPress={() => toast.success(t(K.draft_saved))}>
          {t(K.save_draft)}
        </Button>
      </div>
      <Fab label={t(K.new_order)} />
      <ToastProvider dismissLabel={t(K.dismiss)} />
    </div>
  );
}
