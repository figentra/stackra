/**
 * Stackra file contract:
 * Purpose: the "sizes" demo of the native Drawer: four widths of a tablet's side panel; a phone draws each as a bottom sheet.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          owner request 2026-10-29 (STA-1371).
 */
import type { DrawerSize } from "@stackra/ui/contracts";
import { Button, Drawer, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DRAWER_DEMO_KEYS } from "#src/demos/free/drawer/drawer-demo-keys.constant";

/** The demo's keys. */
const K = DRAWER_DEMO_KEYS.demo_free.drawer.sizes;

/** One drawer per size. */
export default function Sizes() {
  const t = useCatalogueText(MESSAGES.en);
  const SIZES: readonly { readonly size: DrawerSize; readonly label: string }[] = [
    { size: "sm", label: t(K.sm) },
    { size: "md", label: t(K.md) },
    { size: "lg", label: t(K.lg) },
    { size: "full", label: t(K.full) },
  ];
  return (
    <View className="flex-row flex-wrap gap-3">
      {SIZES.map(({ size, label }) => (
        <Drawer key={size} size={size} trigger={<Button variant="secondary">{label}</Button>}>
          <Drawer.Header>
            <Drawer.Title>{t(K.heading)}</Drawer.Title>
            <Drawer.Description>{label}</Drawer.Description>
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
