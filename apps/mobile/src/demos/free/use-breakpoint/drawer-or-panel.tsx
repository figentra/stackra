/**
 * Stackra file contract:
 * Purpose: the "drawer-or-panel" demo of the native useBreakpoint: product filters sit beside the results on a counter
 *          tablet and move into a drawer on a phone.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); ADR 0060.
 */
import {
  Button,
  Checkbox,
  Drawer,
  Text,
  useBreakpoint,
  useCatalogueText,
} from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { USE_BREAKPOINT_DEMO_KEYS } from "#src/demos/free/use-breakpoint/use-breakpoint-demo-keys.constant";

/** The demo's keys. */
const K = USE_BREAKPOINT_DEMO_KEYS.demo_free.use_breakpoint.drawer_or_panel;

/** The filter's categories. */
const CATEGORIES = ["beverages", "bakery", "dairy", "snacks"] as const;

/** A drawer on a phone, a side panel from a tablet up. */
export default function DrawerOrPanel() {
  const t = useCatalogueText(MESSAGES.en);
  const { sizeClass } = useBreakpoint();
  const [isOpen, setIsOpen] = useState(false);
  const [picked, setPicked] = useState<readonly string[]>(["bakery"]);
  const filters = (
    <View className="gap-2">
      {CATEGORIES.map((category) => (
        <Checkbox
          key={category}
          label={t(K[category])}
          value={picked.includes(category)}
          onChange={(isOn) =>
            setPicked(isOn ? [...picked, category] : picked.filter((id) => id !== category))
          }
        />
      ))}
    </View>
  );
  const results = <Text>{t(K.results, { count: picked.length * 12 })}</Text>;

  if (sizeClass === "phone")
    return (
      <View className="items-start gap-3">
        <Button size="sm" variant="secondary" onPress={() => setIsOpen(true)}>
          {t(K.filters)}
        </Button>
        {results}
        <Drawer isOpen={isOpen} onOpenChange={setIsOpen}>
          <Drawer.Header>
            <Drawer.Title>{t(K.filters)}</Drawer.Title>
            <Drawer.Close label={t(K.close)} />
          </Drawer.Header>
          <Drawer.Body>{filters}</Drawer.Body>
        </Drawer>
      </View>
    );
  return (
    <View className="flex-row gap-6">
      <View className="w-48 border-e border-separator pe-4">{filters}</View>
      {results}
    </View>
  );
}
