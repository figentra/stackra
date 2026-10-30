/**
 * Stackra file contract:
 * Purpose: the "close-button" demo of the web Drawer: the four ways `Drawer.Header`'s `closeButton` draws the close
 *          control: the Escape key cap (the default; the close mark on a touch screen), the close mark, both in one
 *          button, or none (Escape and a press outside still close).
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (owner, 2026-10-29);
 *          ADR 0060 (light, dark, RTL); WCAG 2.2 SC 2.5.8.
 */
import type { CloseControl } from "@stackra/ui/contracts";
import { Button, Drawer as UiDrawer, Text, useCatalogueText } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { DRAWER_KEYS } from "#src/demos/free/drawer/drawer-keys.constant";

/** The demo's keys. */
const K = DRAWER_KEYS.drawer;

/** Each control with the key of its trigger's label. */
const CONTROLS = [
  { control: "esc", label: K.close_esc },
  { control: "icon", label: K.close_icon },
  { control: "both", label: K.close_both },
  { control: "none", label: K.close_none },
] as const satisfies readonly { control: CloseControl; label: string }[];

/** Drawer: Close control. */
export default function CloseButton(): ReactElement {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className="flex flex-wrap items-center gap-4">
      {CONTROLS.map(({ control, label }) => (
        <li key={control}>
          <UiDrawer trigger={<Button variant="secondary">{t(label)}</Button>}>
            <UiDrawer.Header closeButton={control}>
              <UiDrawer.Title>{t(K.close_title)}</UiDrawer.Title>
              <UiDrawer.Close label={t(K.close)} />
            </UiDrawer.Header>
            <UiDrawer.Body>
              <Text>
                <bdi>{t(K.close_body)}</bdi>
              </Text>
            </UiDrawer.Body>
            <UiDrawer.Footer>
              <Button variant="secondary" slot="close">
                {t(K.cancel)}
              </Button>
            </UiDrawer.Footer>
          </UiDrawer>
        </li>
      ))}
    </ul>
  );
}
