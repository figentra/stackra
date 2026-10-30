/**
 * Stackra file contract:
 * Purpose: the "views" demo of the web Drawer: a drill-down inside one drawer: store settings, then shipping, then a zone, with
 *          the parallax push; the header's Back pops a view and the title moves with it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060
 *          (light, dark, RTL); owner request 2026-10-29 (STA-1371); WCAG 2.2 SC 2.1.2, 2.4.3 and 4.1.2.
 */
import { Button, Drawer, Text, useCatalogueText, useViewStack } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DRAWER_KEYS } from "#src/demos/free/drawer/drawer-keys.constant";

/** The demo's keys. */
const K = DRAWER_KEYS.drawer;

/** A row that drills into the view `to`. */
function Row({ to, label }: { readonly to: string; readonly label: string }) {
  const { push } = useViewStack();
  return (
    <Button variant="ghost" isFullWidth endIcon="chevron-right" onPress={() => push(to)}>
      {label}
    </Button>
  );
}

/** Drawer: Views. */
export default function Views() {
  const t = useCatalogueText(MESSAGES.en);
  const close = <Drawer.Close label={t(K.close)} />;
  return (
    <Drawer trigger={<Button variant="secondary">{t(K.store_open)}</Button>}>
      <Drawer.ViewStack defaultView="store" transition="push-parallax">
        <Drawer.View id="store" label={t(K.store_title)}>
          <Drawer.Header>
            <Drawer.Title>{t(K.store_title)}</Drawer.Title>
            <Drawer.Description>{t(K.store_description)}</Drawer.Description>
            {close}
          </Drawer.Header>
          <Drawer.Body>
            <div className="grid gap-1">
              <Row to="shipping" label={t(K.shipping)} />
              <Row to="payments" label={t(K.payments)} />
            </div>
          </Drawer.Body>
        </Drawer.View>
        <Drawer.View id="shipping" label={t(K.shipping)}>
          <Drawer.Header>
            <Drawer.Title>{t(K.shipping)}</Drawer.Title>
            {close}
          </Drawer.Header>
          <Drawer.Body>
            <div className="grid gap-3">
              <Text>{t(K.shipping_body)}</Text>
              <Row to="zone" label={t(K.zone_local)} />
            </div>
          </Drawer.Body>
        </Drawer.View>
        <Drawer.View id="zone" label={t(K.zone_local)}>
          <Drawer.Header>
            <Drawer.Title>{t(K.zone_local)}</Drawer.Title>
            {close}
          </Drawer.Header>
          <Drawer.Body>
            <Text>{t(K.zone_body)}</Text>
          </Drawer.Body>
          <Drawer.Footer>
            <Button slot="close">{t(K.done)}</Button>
          </Drawer.Footer>
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
  );
}
