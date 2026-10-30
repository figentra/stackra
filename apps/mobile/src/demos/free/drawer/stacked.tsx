/**
 * Stackra file contract:
 * Purpose: the "stacked" demo of the native Drawer: a drawer opened from inside another stacks over it; the top one shows Back, which
 *          closes just that layer.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          owner request 2026-10-29 (STA-1371).
 */
import { Button, Drawer, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DRAWER_DEMO_KEYS } from "#src/demos/free/drawer/drawer-demo-keys.constant";

/** The demo's keys. */
const K = DRAWER_DEMO_KEYS.demo_free.drawer.stacked;

/** An order, then its customer over it. */
export default function Stacked() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start">
      <Drawer trigger={<Button variant="secondary">{t(K.open)}</Button>}>
        <Drawer.Header>
          <Drawer.Title>{t(K.order)}</Drawer.Title>
          <Drawer.Close label={t(K.close)} />
        </Drawer.Header>
        <Drawer.Body>
          <View className="items-start gap-4">
            <Text>{t(K.order_body)}</Text>
            <Drawer trigger={<Button variant="secondary">{t(K.open_customer)}</Button>}>
              <Drawer.Header>
                <Drawer.Title>{t(K.customer)}</Drawer.Title>
                <Drawer.Close label={t(K.close)} />
              </Drawer.Header>
              <Drawer.Body>
                <Text>{t(K.customer_body)}</Text>
              </Drawer.Body>
            </Drawer>
          </View>
        </Drawer.Body>
      </Drawer>
    </View>
  );
}
