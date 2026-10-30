/**
 * Stackra file contract:
 * Purpose: the "sizes" demo of the web Drawer: four widths, small (400 px), medium (560 px, the default), large (720 px) and
 *          full, each capped to the screen less its margins.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060
 *          (light, dark, RTL); owner request 2026-10-29 (STA-1371); WCAG 2.2 SC 2.1.2, 2.4.3 and 4.1.2.
 */
import type { DrawerSize } from "@stackra/ui/contracts";
import { Button, Drawer, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DRAWER_KEYS } from "#src/demos/free/drawer/drawer-keys.constant";

/** The demo's keys. */
const K = DRAWER_KEYS.drawer;

/** Drawer: Sizes. */
export default function Sizes() {
  const t = useCatalogueText(MESSAGES.en);
  const SIZES: readonly { readonly size: DrawerSize; readonly label: string }[] = [
    { size: "sm", label: t(K.size_sm) },
    { size: "md", label: t(K.size_md) },
    { size: "lg", label: t(K.size_lg) },
    { size: "full", label: t(K.size_full) },
  ];
  return (
    <ul className="flex flex-wrap items-center gap-4">
      {SIZES.map(({ size, label }) => (
        <li key={size}>
          <Drawer size={size} trigger={<Button variant="secondary">{label}</Button>}>
            <Drawer.Header>
              <Drawer.Title>{t(K.sizes_title)}</Drawer.Title>
              <Drawer.Description>{label}</Drawer.Description>
              <Drawer.Close label={t(K.close)} />
            </Drawer.Header>
            <Drawer.Body>
              <Text>{t(K.sizes_body)}</Text>
            </Drawer.Body>
            <Drawer.Footer>
              <Button variant="secondary" slot="close">
                {t(K.done)}
              </Button>
            </Drawer.Footer>
          </Drawer>
        </li>
      ))}
    </ul>
  );
}
