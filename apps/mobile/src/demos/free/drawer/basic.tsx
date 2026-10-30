/**
 * Stackra file contract:
 * Purpose: the "basic" demo of the native Drawer: an edit form: a title and a description, fields in the body, Cancel and Save in the
 *          footer.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          owner request 2026-10-29 (STA-1371).
 */
import { Button, Drawer, TextField, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DRAWER_DEMO_KEYS } from "#src/demos/free/drawer/drawer-demo-keys.constant";

/** The demo's keys. */
const K = DRAWER_DEMO_KEYS.demo_free.drawer.basic;

/** Edit a customer in a drawer. */
export default function Basic() {
  const t = useCatalogueText(MESSAGES.en);
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View className="items-start">
      <Button variant="secondary" onPress={() => setIsOpen(true)}>
        {t(K.open)}
      </Button>
      <Drawer isOpen={isOpen} onOpenChange={setIsOpen}>
        <Drawer.Header>
          <Drawer.Title>{t(K.heading)}</Drawer.Title>
          <Drawer.Description>{t(K.description)}</Drawer.Description>
          <Drawer.Close label={t(K.close)} />
        </Drawer.Header>
        <Drawer.Body>
          <View className="gap-4">
            <TextField label={t(K.first_name)} defaultValue={t(K.first_value)} />
            <TextField label={t(K.email)} defaultValue={t(K.email_value)} />
          </View>
        </Drawer.Body>
        <Drawer.Footer>
          <Button variant="secondary" onPress={() => setIsOpen(false)}>
            {t(K.cancel)}
          </Button>
          <Button onPress={() => setIsOpen(false)}>{t(K.save)}</Button>
        </Drawer.Footer>
      </Drawer>
    </View>
  );
}
