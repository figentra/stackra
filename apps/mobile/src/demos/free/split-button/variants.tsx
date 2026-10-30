/**
 * Stackra file contract:
 * Purpose: the "variants" demo of the native Split button: the POS checkout's charge action in primary and a print action in secondary
 *          and tertiary.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { MenuSection } from "@stackra/ui/contracts";
import { SplitButton, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SPLIT_BUTTON_DEMO_KEYS } from "#src/demos/free/split-button/split-button-demo-keys.constant";

/** The demo's keys. */
const K = SPLIT_BUTTON_DEMO_KEYS.demo_free.split_button.sample;

/** Split button: Variants. */
export default function Variants() {
  const t = useCatalogueText(MESSAGES.en);
  const charge: readonly MenuSection[] = [
    {
      id: "charge",
      title: t(K.charge_options),
      isTitleHidden: true,
      items: [
        { id: "split", label: t(K.split_bill) },
        { id: "later", label: t(K.pay_later) },
      ],
    },
  ];
  const print: readonly MenuSection[] = [
    {
      id: "print",
      title: t(K.print_options),
      isTitleHidden: true,
      items: [
        { id: "gift", label: t(K.gift_receipt) },
        { id: "email", label: t(K.email_receipt) },
      ],
    },
  ];
  return (
    <View className="items-start gap-3">
      <SplitButton menuLabel={t(K.more_charge_options)} sections={charge} size="lg">
        {t(K.charge)}
      </SplitButton>
      <SplitButton menuLabel={t(K.more_print_options)} sections={print} variant="secondary">
        {t(K.print)}
      </SplitButton>
      <SplitButton
        menuLabel={t(K.more_print_options)}
        sections={print}
        variant="tertiary"
        size="sm"
      >
        {t(K.print)}
      </SplitButton>
    </View>
  );
}
