/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native Overflow toolbar: make the row narrower or wider and watch actions move into and out of the
 *          menu.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, OverflowToolbar, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
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

/** The row widths the demo steps through, as a share of the screen. */
const WIDTHS = ["w-full", "w-3/4", "w-1/2"] as const;

/** Overflow toolbar: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [step, setStep] = useState(0);
  const [chosen, setChosen] = useState<string | undefined>(undefined);
  const items = useOrderActions(setChosen);
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          isDisabled={step === WIDTHS.length - 1}
          onPress={() => setStep((value) => value + 1)}
        >
          {t(K.narrower)}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          isDisabled={step === 0}
          onPress={() => setStep((value) => value - 1)}
        >
          {t(K.wider)}
        </Button>
      </View>
      <View className={WIDTHS[step] ?? "w-full"}>
        <OverflowToolbar label={t(K.label)} moreLabel={t(K.more)} items={items} size="sm" />
      </View>
      <Text type="small" tone="muted" accessibilityLiveRegion="polite">
        {chosen === undefined ? t(K.nothing_chosen) : t(K.chosen, { action: chosen })}
      </Text>
    </View>
  );
}
