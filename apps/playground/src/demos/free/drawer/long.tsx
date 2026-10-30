/**
 * Stackra file contract:
 * Purpose: the "long" demo of the web Drawer: A long body scrolls inside the drawer; the header and footer stay in
 *          place.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL); WCAG 2.2 SC 2.1.1, 2.1.2, 2.4.3 and 4.1.2.
 */
import { Button, Drawer as UiDrawer, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DRAWER_KEYS } from "#src/demos/free/drawer/drawer-keys.constant";

/** The demo's keys. */
const K = DRAWER_KEYS.drawer;

/** Drawer: Long content. */
export default function Long() {
  const t = useCatalogueText(MESSAGES.en);
  /** Thirty entries, enough to overflow the drawer in a normal window. */
  const ENTRIES = Array.from({ length: 30 }, (_, index) => `${index + 1}. ${t(K.long_body)}`);
  return (
    <div>
      <UiDrawer trigger={<Button variant="secondary">{t(K.open_long)}</Button>}>
        <UiDrawer.Header>
          <UiDrawer.Title>{t(K.long_title)}</UiDrawer.Title>
          <UiDrawer.Close label={t(K.close)} />
        </UiDrawer.Header>
        <UiDrawer.Body tabIndex={0}>
          {ENTRIES.map((entry) => (
            <Text key={entry}>
              <bdi>{entry}</bdi>
            </Text>
          ))}
        </UiDrawer.Body>
        <UiDrawer.Footer>
          <Button slot="close">{t(K.done)}</Button>
        </UiDrawer.Footer>
      </UiDrawer>
    </div>
  );
}
