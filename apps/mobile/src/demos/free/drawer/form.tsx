/**
 * Stackra file contract:
 * Purpose: the "form" demo of the native Drawer: it moves clear of the keyboard while a field inside is edited.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Drawer, Text, TextField, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DRAWER_DEMO_KEYS } from "#src/demos/free/drawer/drawer-demo-keys.constant";

/** The demo's keys. */
const K = DRAWER_DEMO_KEYS.demo_free.drawer.form;

/** Rename the order in a drawer; Save closes it. */
export default function Form() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useCatalogueText(MESSAGES.en);
  const [name, setName] = useState(() => t(K.initial));
  const [saved, setSaved] = useState<string | null>(null);
  return (
    <View className="items-start gap-3">
      <Button variant="secondary" onPress={() => setIsOpen(true)}>
        {t(K.open)}
      </Button>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {saved === null ? t(K.none) : t(K.saved, { name: saved })}
      </Text>
      <Drawer isOpen={isOpen} onOpenChange={setIsOpen}>
        <Drawer.Header>
          <Drawer.Title>{t(K.heading)}</Drawer.Title>
          <Drawer.Close label={t(K.close)} />
        </Drawer.Header>
        <Drawer.Body>
          <TextField label={t(K.field)} value={name} onChange={setName} />
        </Drawer.Body>
        <Drawer.Footer>
          <Button
            onPress={() => {
              setSaved(name);
              setIsOpen(false);
            }}
          >
            {t(K.save)}
          </Button>
        </Drawer.Footer>
      </Drawer>
    </View>
  );
}
