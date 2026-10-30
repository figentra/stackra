/**
 * Stackra file contract:
 * Purpose: the "stacked" demo of the web Drawer: a drawer opened from inside another stacks over it: the one under recedes and
 *          dims, the top one shows Back, and Back or Escape closes only the top layer. Three layers deep at most.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060
 *          (light, dark, RTL); owner request 2026-10-29 (STA-1371); WCAG 2.2 SC 2.1.2, 2.4.3 and 4.1.2.
 */
import { Button, Drawer, Text, TextField, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DRAWER_KEYS } from "#src/demos/free/drawer/drawer-keys.constant";

/** The demo's keys. */
const K = DRAWER_KEYS.drawer;

/** The Drawer demo: stacked. */
export default function Stacked() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Drawer trigger={<Button variant="secondary">{t(K.order_open)}</Button>}>
      <Drawer.Header>
        <Drawer.Title>{t(K.order_title)}</Drawer.Title>
        <Drawer.Close label={t(K.close)} />
      </Drawer.Header>
      <Drawer.Body>
        <div className="grid justify-items-start gap-4">
          <Text>{t(K.order_body)}</Text>
          <Drawer trigger={<Button variant="secondary">{t(K.open_customer)}</Button>}>
            <Drawer.Header>
              <Drawer.Title>{t(K.customer_title)}</Drawer.Title>
              <Drawer.Close label={t(K.close)} />
            </Drawer.Header>
            <Drawer.Body>
              <div className="grid justify-items-start gap-4">
                <Text>{t(K.customer_body)}</Text>
                <Drawer
                  size="sm"
                  trigger={<Button variant="secondary">{t(K.open_address)}</Button>}
                >
                  <Drawer.Header>
                    <Drawer.Title>{t(K.address_title)}</Drawer.Title>
                    <Drawer.Close label={t(K.close)} />
                  </Drawer.Header>
                  <Drawer.Body>
                    <TextField label={t(K.street)} defaultValue={t(K.street_value)} />
                  </Drawer.Body>
                  <Drawer.Footer>
                    <Button variant="secondary" slot="close">
                      {t(K.cancel)}
                    </Button>
                    <Button slot="close">{t(K.save)}</Button>
                  </Drawer.Footer>
                </Drawer>
              </div>
            </Drawer.Body>
          </Drawer>
        </div>
      </Drawer.Body>
      <Drawer.Footer>
        <Button variant="secondary" slot="close">
          {t(K.done)}
        </Button>
      </Drawer.Footer>
    </Drawer>
  );
}
