/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Popover: a trigger opens it under itself; a press outside closes it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Popover, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { POPOVER_DEMO_KEYS } from "#src/demos/free/popover/popover-demo-keys.constant";

/** The demo's keys. */
const K = POPOVER_DEMO_KEYS.demo_free.popover.basics;

/** A titled popover. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Popover title={t(K.heading)} trigger={<Button variant="secondary">{t(K.open)}</Button>}>
      {t(K.body)}
    </Popover>
  );
}
