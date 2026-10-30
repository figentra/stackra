/**
 * Stackra file contract:
 * Purpose: the "icon" demo of the native Tooltip: an icon button named by its label, the tooltip saying what it does.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           A phone has no hover: the tooltip is the element's accessibility hint, so the caption repeats it.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { IconButton, Tooltip, useCatalogueText } from "@stackra/ui/native";

import { Sample } from "#src/components/ui/sample";
import { MESSAGES } from "#src/constants/messages.constant";
import { TOOLTIP_DEMO_KEYS } from "#src/demos/free/tooltip/tooltip-demo-keys.constant";

/** The demo's keys. */
const K = TOOLTIP_DEMO_KEYS.demo_free.tooltip;

/** The label names the icon button; the tooltip adds what it will do. */
export default function Icon() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Sample caption={t(K.caption, { hint: t(K.icon_button.hint) })}>
      <Tooltip content={t(K.icon_button.hint)}>
        <IconButton icon="trash" label={t(K.icon_button.label)} variant="danger-soft" />
      </Tooltip>
    </Sample>
  );
}
