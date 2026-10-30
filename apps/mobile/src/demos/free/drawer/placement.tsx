/**
 * Stackra file contract:
 * Purpose: the "placement" demo of the native Drawer: start and end are floating side panels on a tablet, following the reading
 *          direction; a phone draws every drawer as a bottom sheet.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          owner request 2026-10-29 (STA-1371).
 */
import { Button, Drawer, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DRAWER_DEMO_KEYS } from "#src/demos/free/drawer/drawer-demo-keys.constant";

/** The demo's keys. */
const K = DRAWER_DEMO_KEYS.demo_free.drawer.placement;

/** One drawer per edge. */
export default function Placement() {
  const t = useCatalogueText(MESSAGES.en);
  const PLACEMENTS = [
    { placement: "start", label: t(K.start) },
    { placement: "end", label: t(K.end) },
    { placement: "bottom", label: t(K.bottom) },
  ] as const;
  return (
    <View className="flex-row flex-wrap gap-3">
      {PLACEMENTS.map(({ placement, label }) => (
        <Drawer
          key={placement}
          placement={placement}
          trigger={<Button variant="secondary">{label}</Button>}
        >
          <Drawer.Header>
            <Drawer.Title>{t(K.heading)}</Drawer.Title>
            <Drawer.Close label={t(K.close)} />
          </Drawer.Header>
          <Drawer.Body>
            <Text>{t(K.body)}</Text>
          </Drawer.Body>
        </Drawer>
      ))}
    </View>
  );
}
