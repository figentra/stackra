/**
 * Stackra file contract:
 * Purpose: the "controlled" demo of the native Drawer: the page holds `isOpen`, so its own buttons open and close it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Drawer, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DRAWER_DEMO_KEYS } from "#src/demos/free/drawer/drawer-demo-keys.constant";

/** The demo's keys. */
const K = DRAWER_DEMO_KEYS.demo_free.drawer.controlled;

/** Open from outside; the footer buttons close it and record the choice. */
export default function Controlled() {
  const [isOpen, setIsOpen] = useState(false);
  const [last, setLast] = useState<"cancel" | "confirm" | null>(null);
  const t = useCatalogueText(MESSAGES.en);
  const choose = (choice: "cancel" | "confirm") => {
    setLast(choice);
    setIsOpen(false);
  };
  return (
    <View className="items-start gap-3">
      <Button variant="secondary" onPress={() => setIsOpen(true)}>
        {t(K.open)}
      </Button>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(isOpen ? K.is_open : K.is_closed)}
      </Text>
      <Text tone="muted">{last === null ? t(K.none) : t(K.last, { action: t(K[last]) })}</Text>
      <Drawer isOpen={isOpen} onOpenChange={setIsOpen}>
        <Drawer.Header>
          <Drawer.Title>{t(K.heading)}</Drawer.Title>
          <Drawer.Close label={t(K.close)} />
        </Drawer.Header>
        <Drawer.Body>{t(K.body)}</Drawer.Body>
        <Drawer.Footer>
          <Button variant="tertiary" onPress={() => choose("cancel")}>
            {t(K.cancel)}
          </Button>
          <Button onPress={() => choose("confirm")}>{t(K.confirm)}</Button>
        </Drawer.Footer>
      </Drawer>
    </View>
  );
}
