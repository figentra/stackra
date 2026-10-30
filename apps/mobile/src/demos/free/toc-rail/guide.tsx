/**
 * Stackra file contract:
 * Purpose: the "guide" demo of the native TocRail: a setup guide.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (wave 3b).
 */
import { Text, TocRail, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TOC_RAIL_DEMO_KEYS } from "#src/demos/free/toc-rail/toc-rail-demo-keys.constant";

/** The demo's keys. */
const K = TOC_RAIL_DEMO_KEYS.demo_free.toc_rail.guide;

const SECTIONS = [
  ["setup", "setup_text", 2],
  ["menu", "menu_text", 2],
  ["modifiers", "modifiers_text", 3],
  ["payments", "payments_text", 2],
] as const;

/** Press a section to make it current; the screen scrolls its own list. */
export default function Guide() {
  const t = useCatalogueText(MESSAGES.en);
  const [current, setCurrent] = useState<string>("setup");
  const section = SECTIONS.find(([id]) => id === current) ?? SECTIONS[0];
  return (
    <View className="gap-4">
      <TocRail
        label={t(K.label)}
        activeId={current}
        onSelect={setCurrent}
        items={SECTIONS.map(([id, , level]) => ({ id, label: t(K[id]), level }))}
      />
      <View className="gap-1">
        <Text className="font-semibold">{t(K[section[0]])}</Text>
        <Text type="small" tone="muted">
          {t(K[section[1]])}
        </Text>
      </View>
    </View>
  );
}
