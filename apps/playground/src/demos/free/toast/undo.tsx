/**
 * Stackra file contract:
 * Purpose: the "undo" demo of the web Toast: deleting shows a toast with "Undo" and a ring that empties; the line
 *          below says whether the order was restored or deleted for good once the toast closed.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0312; WCAG 2.2 SC 2.2.1 and
 *          4.1.3; ADR 0060 (light, dark, RTL); STA-1371 (owner request 2026-10-29).
 */
import { Button, Text, toast, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TOAST_KEYS } from "#src/demos/free/toast/toast-keys.constant";

/** The demo's keys. */
const K = TOAST_KEYS.toast.undo;

/** Toast: undo with a countdown. */
export default function Undo() {
  const t = useCatalogueText(MESSAGES.en);
  const [outcome, setOutcome] = useState<"waiting" | "undone" | "committed">("waiting");
  return (
    <div className="grid justify-items-start gap-3">
      <Button
        variant="secondary"
        onPress={() =>
          toast.undo(t(K.deleted), {
            onUndo: () => setOutcome("undone"),
            onCommit: () => setOutcome("committed"),
          })
        }
      >
        {t(K.delete)}
      </Button>
      <Text tone="muted" aria-live="polite">
        {t(K[outcome])}
      </Text>
    </div>
  );
}
