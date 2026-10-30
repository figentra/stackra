/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Split button: Save with its related actions behind the caret; the last chosen action
 *          shows underneath.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import type { MenuSection } from "@stackra/ui/contracts";
import { SplitButton, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SPLIT_BUTTON_KEYS } from "#src/demos/free/split-button/split-button-keys.constant";

/** The demo's keys. */
const K = SPLIT_BUTTON_KEYS.split_button;

/** Split button: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [chosen, setChosen] = useState<string | undefined>(undefined);
  const sections: readonly MenuSection[] = [
    {
      id: "save",
      title: t(K.save_options),
      isTitleHidden: true,
      items: [
        { id: "save-new", label: t(K.save_new), onPress: () => setChosen(t(K.save_new)) },
        { id: "save-draft", label: t(K.save_draft), onPress: () => setChosen(t(K.save_draft)) },
      ],
    },
    {
      id: "danger",
      title: t(K.discard),
      isTitleHidden: true,
      items: [
        {
          id: "discard",
          label: t(K.discard),
          tone: "danger",
          onPress: () => setChosen(t(K.discard)),
        },
      ],
    },
  ];
  return (
    <div className="grid justify-items-start gap-3">
      <SplitButton
        menuLabel={t(K.more_save_options)}
        sections={sections}
        onPress={() => setChosen(t(K.save))}
      >
        {t(K.save)}
      </SplitButton>
      <Text type="small" tone="muted" aria-live="polite">
        {chosen === undefined ? t(K.nothing_chosen) : t(K.chosen, { action: chosen })}
      </Text>
    </div>
  );
}
