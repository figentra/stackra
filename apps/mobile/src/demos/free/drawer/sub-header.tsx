/**
 * Stackra file contract:
 * Purpose: the "sub-header" demo of the native Drawer: a segmented control in the sub-header switches the body between three sections.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          owner request 2026-10-29 (STA-1371).
 */
import type { SegmentItem } from "@stackra/ui/contracts";
import { Button, Drawer, SegmentedControl, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DRAWER_DEMO_KEYS } from "#src/demos/free/drawer/drawer-demo-keys.constant";

/** The demo's keys. */
const K = DRAWER_DEMO_KEYS.demo_free.drawer.sub_header;

/** A product drawer with sections in its sub-header. */
export default function SubHeader() {
  const t = useCatalogueText(MESSAGES.en);
  const [section, setSection] = useState("details");
  const items: readonly SegmentItem[] = [
    { id: "details", label: t(K.details) },
    { id: "stock", label: t(K.stock) },
    { id: "history", label: t(K.history) },
  ];
  const body = { details: K.details_body, stock: K.stock_body, history: K.history_body } as const;
  return (
    <View className="items-start">
      <Drawer trigger={<Button variant="secondary">{t(K.open)}</Button>}>
        <Drawer.Header>
          <Drawer.Title>{t(K.heading)}</Drawer.Title>
          <Drawer.Description>{t(K.description)}</Drawer.Description>
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
      </Drawer>
    </View>
  );
}
