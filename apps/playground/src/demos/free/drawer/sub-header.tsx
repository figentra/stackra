/**
 * Stackra file contract:
 * Purpose: the "sub-header" demo of the web Drawer: a segmented control in the sub-header switches the body between three sections; the
 *          band stays put while the body scrolls.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060
 *          (light, dark, RTL); owner request 2026-10-29 (STA-1371); WCAG 2.2 SC 2.1.2, 2.4.3 and 4.1.2.
 */
import type { SegmentItem } from "@stackra/ui/contracts";
import { Button, Drawer, SegmentedControl, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DRAWER_KEYS } from "#src/demos/free/drawer/drawer-keys.constant";

/** The demo's keys. */
const K = DRAWER_KEYS.drawer;

/** Drawer: With a sub-header. */
export default function SubHeader() {
  const t = useCatalogueText(MESSAGES.en);
  const [section, setSection] = useState("details");
  const items: readonly SegmentItem[] = [
    { id: "details", label: t(K.tab_details) },
    { id: "stock", label: t(K.tab_stock) },
    { id: "history", label: t(K.tab_history) },
  ];
  const body = { details: K.details_body, stock: K.stock_body, history: K.history_body } as const;
  return (
    <Drawer trigger={<Button variant="secondary">{t(K.product_open)}</Button>}>
      <Drawer.Header>
        <Drawer.Title>{t(K.product_title)}</Drawer.Title>
        <Drawer.Description>{t(K.product_description)}</Drawer.Description>
        <Drawer.Close label={t(K.close)} />
      </Drawer.Header>
      <Drawer.SubHeader>
        <SegmentedControl
          label={t(K.sections)}
          items={items}
          selectedKey={section}
          onSelectionChange={setSection}
          isFullWidth
        />
      </Drawer.SubHeader>
      <Drawer.Body>
        <Text>{t(body[section as keyof typeof body])}</Text>
      </Drawer.Body>
      <Drawer.Footer>
        <Button variant="secondary" slot="close">
          {t(K.done)}
        </Button>
      </Drawer.Footer>
    </Drawer>
  );
}
