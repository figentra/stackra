/**
 * Stackra file contract:
 * Purpose: the "controlled" demo of the native Popover: the page holds `isOpen`; a button inside closes it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Popover, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { POPOVER_DEMO_KEYS } from "#src/demos/free/popover/popover-demo-keys.constant";

/** The demo's keys. */
const K = POPOVER_DEMO_KEYS.demo_free.popover.controlled;

/** Content of its own and a Done button. */
export default function Controlled() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start gap-3">
      <Popover
        title={t(K.heading)}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        trigger={<Button variant="secondary">{t(K.open)}</Button>}
      >
        <Text>{t(K.body)}</Text>
        <Button size="sm" onPress={() => setIsOpen(false)}>
          {t(K.done)}
        </Button>
      </Popover>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(isOpen ? K.is_open : K.is_closed)}
      </Text>
    </View>
  );
}
