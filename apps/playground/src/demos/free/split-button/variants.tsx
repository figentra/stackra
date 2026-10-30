/**
 * Stackra file contract:
 * Purpose: the "variants" demo of the web Split button: the POS checkout's charge action in primary, a print action in secondary and
 *          tertiary, at each size; both halves always share the look.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import type { MenuSection } from "@stackra/ui/contracts";
import { SplitButton, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SPLIT_BUTTON_KEYS } from "#src/demos/free/split-button/split-button-keys.constant";

/** The demo's keys. */
const K = SPLIT_BUTTON_KEYS.split_button;

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
    <div className="flex flex-wrap items-center gap-4">
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
    </div>
  );
}
