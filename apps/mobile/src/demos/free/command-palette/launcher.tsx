/**
 * Stackra file contract:
 * Purpose: the "launcher" demo of the native CommandPalette: go to and create.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (wave 3b).
 */
import { Button, CommandPalette, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { COMMAND_PALETTE_DEMO_KEYS } from "#src/demos/free/command-palette/command-palette-demo-keys.constant";

/** The demo's keys. */
const K = COMMAND_PALETTE_DEMO_KEYS.demo_free.command_palette.launcher;

/** Open the palette, type, and press a command. */
export default function Launcher() {
  const t = useCatalogueText(MESSAGES.en);
  const [isOpen, setOpen] = useState(false);
  const [ran, setRan] = useState("");
  const sections = [
    {
      id: "go",
      title: t(K.go),
      items: [
        {
          id: "orders",
          label: t(K.orders),
          icon: "shopping-bag" as const,
          keywords: t(K.sales_words),
        },
        { id: "customers", label: t(K.customers), icon: "users" as const },
        { id: "reports", label: t(K.reports), icon: "chart-column" as const },
      ],
    },
    {
      id: "create",
      title: t(K.create),
      items: [
        { id: "product", label: t(K.product), icon: "plus" as const },
        { id: "discount", label: t(K.discount), icon: "percent" as const },
      ],
    },
  ];
  return (
    <View className="items-start gap-2">
      <Button variant="secondary" startIcon="search" onPress={() => setOpen(true)}>
        {t(K.open)}
      </Button>
      <CommandPalette
        isOpen={isOpen}
        onOpenChange={setOpen}
        sections={sections}
        onAction={(id) => setRan(t(K[id as "orders"]))}
      />
      <Text type="small" tone="muted">
        {ran ? t(K.ran, { command: ran }) : ""}
      </Text>
    </View>
  );
}
