/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Drawer: A controlled drawer: Apply closes it and keeps the setting, Cancel
 *          keeps the old one.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL); WCAG 2.2 SC 2.1.1, 2.1.2, 2.4.3 and 4.1.2.
 */
import { Button, Drawer as UiDrawer, Switch, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DRAWER_KEYS } from "#src/demos/free/drawer/drawer-keys.constant";

/** The demo's keys. */
const K = DRAWER_KEYS.drawer;

/** Drawer: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [isOpen, setIsOpen] = useState(false);

  const [isEmailOn, setIsEmailOn] = useState(true);

  const [draft, setDraft] = useState(isEmailOn);

  return (
    <div className="grid max-w-sm gap-3">
      <div>
        <Button
          onPress={() => {
            setDraft(isEmailOn);
            setIsOpen(true);
          }}
        >
          {t(K.open_settings)}
        </Button>
      </div>
      <Text role="status">
        <bdi>{`${t(K.notifications)} ${isEmailOn ? t(K.on) : t(K.off)}`}</bdi>
      </Text>
      <UiDrawer isOpen={isOpen} onOpenChange={setIsOpen}>
        <UiDrawer.Header>
          <UiDrawer.Title>{t(K.settings_title)}</UiDrawer.Title>
          <UiDrawer.Close label={t(K.close)} />
        </UiDrawer.Header>
        <UiDrawer.Body>
          <Switch label={t(K.email_notifications)} value={draft} onChange={setDraft} />
        </UiDrawer.Body>
        <UiDrawer.Footer>
          <Button variant="secondary" slot="close">
            {t(K.cancel)}
          </Button>
          <Button
            onPress={() => {
              setIsEmailOn(draft);
              setIsOpen(false);
            }}
          >
            {t(K.apply)}
          </Button>
        </UiDrawer.Footer>
      </UiDrawer>
    </div>
  );
}
