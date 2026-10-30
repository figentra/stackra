/**
 * Stackra file contract:
 * Purpose: the "speed-dial" demo of the web Floating action button: a plus that fans out three related actions; the last chosen shows above.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL).
 */
import type { FabAction } from "@stackra/ui/contracts";
import { Fab, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { FAB_KEYS } from "#src/demos/free/fab/fab-keys.constant";

/** The demo's keys. */
const K = FAB_KEYS.fab;

/** Floating action button: Speed dial. */
export default function SpeedDial() {
  const t = useCatalogueText(MESSAGES.en);
  const [chosen, setChosen] = useState<string | undefined>(undefined);
  const actions: readonly FabAction[] = [
    { id: "scan", label: t(K.scan), icon: Icons.ScanLine },
    { id: "note", label: t(K.note), icon: Icons.Pencil },
    { id: "photo", label: t(K.photo), icon: Icons.Camera },
  ];
  return (
    <div className="relative h-72 w-full rounded-[var(--radius-container)] border border-dashed border-border p-4">
      <Text type="small" tone="muted" aria-live="polite">
        {chosen === undefined ? t(K.nothing_chosen) : t(K.chosen, { action: chosen })}
      </Text>
      <Fab
        label={t(K.create)}
        actions={actions}
        onAction={(id) => setChosen(actions.find((action) => action.id === id)?.label)}
      />
    </div>
  );
}
