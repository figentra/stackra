/**
 * Stackra file contract:
 * Purpose: the "views" demo of the native Drawer: a drill-down inside one drawer with the parallax push: store settings, then shipping,
 *          then a zone; the header's Back pops a view.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          owner request 2026-10-29 (STA-1371).
 */
import { Button, Drawer, Text, useCatalogueText, useViewStack } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DRAWER_DEMO_KEYS } from "#src/demos/free/drawer/drawer-demo-keys.constant";

/** The demo's keys. */
const K = DRAWER_DEMO_KEYS.demo_free.drawer.views;

/** A row that drills into the view `to`. */
function Row({ to, label }: { readonly to: string; readonly label: string }) {
  const { push } = useViewStack();
  return (
    <Button variant="ghost" isFullWidth endIcon="chevron-right" onPress={() => push(to)}>
      {label}
    </Button>
  );
}

/** Store settings with views to drill into. */
export default function Views() {
  const t = useCatalogueText(MESSAGES.en);
  const close = <Drawer.Close label={t(K.close)} />;
  return (
    <View className="items-start">
      <Drawer trigger={<Button variant="secondary">{t(K.open)}</Button>}>
        <Drawer.ViewStack defaultView="store" transition="push-parallax">
          <Drawer.View id="store" label={t(K.store)}>
            <Drawer.Header>
              <Drawer.Title>{t(K.store)}</Drawer.Title>
              <Drawer.Description>{t(K.store_description)}</Drawer.Description>
              {close}
            </Drawer.Header>
            <Drawer.Body>
              <Row to="shipping" label={t(K.shipping)} />
              <Row to="payments" label={t(K.payments)} />
            </Drawer.Body>
          </Drawer.View>
          <Drawer.View id="shipping" label={t(K.shipping)}>
            <Drawer.Header>
              <Drawer.Title>{t(K.shipping)}</Drawer.Title>
              {close}
            </Drawer.Header>
            <Drawer.Body>
              <Text>{t(K.shipping_body)}</Text>
              <Row to="zone" label={t(K.zone)} />
            </Drawer.Body>
          </Drawer.View>
          <Drawer.View id="zone" label={t(K.zone)}>
            <Drawer.Header>
              <Drawer.Title>{t(K.zone)}</Drawer.Title>
              {close}
            </Drawer.Header>
            <Drawer.Body>
              <Text>{t(K.zone_body)}</Text>
            </Drawer.Body>
          </Drawer.View>
          <Drawer.View id="payments" label={t(K.payments)}>
            <Drawer.Header>
              <Drawer.Title>{t(K.payments)}</Drawer.Title>
              {close}
            </Drawer.Header>
            <Drawer.Body>
              <Text>{t(K.payments_body)}</Text>
            </Drawer.Body>
          </Drawer.View>
        </Drawer.ViewStack>
      </Drawer>
    </View>
  );
}
