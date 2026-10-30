/**
 * Stackra file contract:
 * Purpose: the "locked" demo of the native Popover: `isDismissable` off, so its content closes it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Popover, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { POPOVER_DEMO_KEYS } from "#src/demos/free/popover/popover-demo-keys.constant";

/** The demo's keys. */
const K = POPOVER_DEMO_KEYS.demo_free.popover.locked;

/** A press outside does nothing. */
export default function Locked() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Popover
      title={t(K.heading)}
      isDismissable={false}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      trigger={<Button variant="secondary">{t(K.open)}</Button>}
    >
      <Text>{t(K.body)}</Text>
      <Button size="sm" variant="tertiary" onPress={() => setIsOpen(false)}>
        {t(K.discard)}
      </Button>
    </Popover>
  );
}
