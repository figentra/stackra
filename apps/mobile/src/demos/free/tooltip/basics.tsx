/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Tooltip: its text becomes the button's accessibility hint.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           A phone has no hover: the tooltip is the element's accessibility hint, so the caption repeats it.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Tooltip, useCatalogueText } from "@stackra/ui/native";

import { Sample } from "#src/components/ui/sample";
import { MESSAGES } from "#src/constants/messages.constant";
import { TOOLTIP_DEMO_KEYS } from "#src/demos/free/tooltip/tooltip-demo-keys.constant";

/** The demo's keys. */
const K = TOOLTIP_DEMO_KEYS.demo_free.tooltip;

/** A screen reader says the hint after the button's name. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Sample caption={t(K.caption, { hint: t(K.basics.hint) })}>
      <Tooltip content={t(K.basics.hint)}>
        <Button variant="secondary">{t(K.basics.button)}</Button>
      </Tooltip>
    </Sample>
  );
}
