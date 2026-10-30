/**
 * Stackra file contract:
 * Purpose: the "narrow" demo of the native Overflow toolbar: the same actions in half the width keep only the first.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { OverflowToolbar, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { OVERFLOW_TOOLBAR_DEMO_KEYS } from "#src/demos/free/overflow-toolbar/overflow-toolbar-demo-keys.constant";

/** The demo's keys. */
const K = OVERFLOW_TOOLBAR_DEMO_KEYS.demo_free.overflow_toolbar.sample;

/** A paid order's actions on the POS, most used first, each reporting its label when chosen. */
function useOrderActions(onChoose: (label: string) => void) {
  const t = useCatalogueText(MESSAGES.en);
  return [
    { id: "refund", label: t(K.refund) },
    { id: "print", label: t(K.print_receipt), icon: Icons.Download },
    { id: "email", label: t(K.email_receipt), icon: Icons.SendHorizontal },
    { id: "split", label: t(K.split_bill), icon: Icons.Copy },
    { id: "void", label: t(K.void), icon: Icons.Trash, tone: "danger" as const },
  ].map((item) => ({ ...item, onPress: () => onChoose(item.label) }));
}

/** Overflow toolbar: Narrow. */
export default function Narrow() {
  const t = useCatalogueText(MESSAGES.en);
  const items = useOrderActions(() => undefined);
  return (
    <View className="w-1/2">
      <OverflowToolbar label={t(K.label)} moreLabel={t(K.more)} items={items} size="sm" />
    </View>
  );
}
