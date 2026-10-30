/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Inline select: Basics.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { InlineSelect, Text, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { INLINE_SELECT_KEYS } from "#src/demos/free/inline-select/inline-select-keys.constant";

/** The demo's keys. */
const K = INLINE_SELECT_KEYS.inline_select.basics;

/** Inline select: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="flex flex-wrap items-baseline gap-1">
      <Text>{t(K.before)}</Text>
      <InlineSelect
        label={t(K.label)}
        items={[
          { id: "10", label: t(K.ten) },
          { id: "25", label: t(K.twenty_five) },
          { id: "50", label: t(K.fifty) },
        ]}
        defaultValue="25"
      />
      <Text>{t(K.after)}</Text>
    </div>
  );
}
