/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Overflow toolbar: a paid order's actions; at full width every one is a button.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import { OverflowToolbar, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { OVERFLOW_TOOLBAR_KEYS } from "#src/demos/free/overflow-toolbar/overflow-toolbar-keys.constant";

/** The demo's keys. */
const K = OVERFLOW_TOOLBAR_KEYS.overflow_toolbar;

/** A paid order's actions on the POS, most used first, each reporting its label when chosen. */
function useOrderActions(onChoose: (label: string) => void) {
  const t = useCatalogueText(MESSAGES.en);
  return [
    { id: "refund", label: t(K.refund), icon: Icons.RotateCcw },
    { id: "print", label: t(K.print_receipt), icon: Icons.Receipt },
    { id: "email", label: t(K.email_receipt), icon: Icons.SendHorizontal },
    { id: "split", label: t(K.split_bill), icon: Icons.Columns2 },
    { id: "void", label: t(K.void), icon: Icons.Trash, tone: "danger" as const },
  ].map((item) => ({ ...item, onPress: () => onChoose(item.label) }));
}

/** Overflow toolbar: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [chosen, setChosen] = useState<string | undefined>(undefined);
  const items = useOrderActions(setChosen);
  return (
    <div className="grid w-full gap-3">
      <OverflowToolbar label={t(K.label)} moreLabel={t(K.more)} items={items} />
      <Text type="small" tone="muted" aria-live="polite">
        {chosen === undefined ? t(K.nothing_chosen) : t(K.chosen, { action: chosen })}
      </Text>
    </div>
  );
}
