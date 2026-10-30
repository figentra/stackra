/**
 * Stackra file contract:
 * Purpose: the "basic" demo of the web Drawer: an edit form in the floating drawer: a title and a description, fields in the
 *          body, Cancel and Save in the footer.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060
 *          (light, dark, RTL); owner request 2026-10-29 (STA-1371); WCAG 2.2 SC 2.1.2, 2.4.3 and 4.1.2.
 */
import { Button, Drawer, TextField, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DRAWER_KEYS } from "#src/demos/free/drawer/drawer-keys.constant";

/** The demo's keys. */
const K = DRAWER_KEYS.drawer;

/** The Drawer demo: basic. */
export default function Basic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Drawer trigger={<Button variant="secondary">{t(K.edit_open)}</Button>}>
      <Drawer.Header>
        <Drawer.Title>{t(K.edit_title)}</Drawer.Title>
        <Drawer.Description>{t(K.edit_description)}</Drawer.Description>
        <Drawer.Close label={t(K.close)} />
      </Drawer.Header>
      <Drawer.Body>
        <div className="grid gap-4">
          <TextField label={t(K.first_name)} defaultValue={t(K.first_value)} />
          <TextField label={t(K.last_name)} defaultValue={t(K.last_value)} />
          <TextField label={t(K.email)} defaultValue={t(K.email_value)} type="email" />
        </div>
      </Drawer.Body>
      <Drawer.Footer>
        <Button variant="secondary" slot="close">
          {t(K.cancel)}
        </Button>
        <Button slot="close">{t(K.save)}</Button>
      </Drawer.Footer>
    </Drawer>
  );
}
