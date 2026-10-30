/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Split button: a disabled pair, and a loading one where the caret is refused while the
 *          primary action runs.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import type { MenuSection } from "@stackra/ui/contracts";
import { Button, SplitButton, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SPLIT_BUTTON_KEYS } from "#src/demos/free/split-button/split-button-keys.constant";

/** The demo's keys. */
const K = SPLIT_BUTTON_KEYS.split_button;

/** Split button: States. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  const [isSaving, setIsSaving] = useState(true);
  const sections: readonly MenuSection[] = [
    {
      id: "save",
      title: t(K.save_options),
      isTitleHidden: true,
      items: [{ id: "save-new", label: t(K.save_new) }],
    },
  ];
  return (
    <ul className="flex flex-wrap items-start gap-6">
      <li className="grid justify-items-start gap-2">
        <SplitButton menuLabel={t(K.more_save_options)} sections={sections} isDisabled>
          {t(K.save)}
        </SplitButton>
        <Text type="small" tone="muted">
          {t(K.disabled)}
        </Text>
      </li>
      <li className="grid justify-items-start gap-2">
        <SplitButton menuLabel={t(K.more_save_options)} sections={sections} isLoading={isSaving}>
          {t(K.save)}
        </SplitButton>
        <Button size="sm" variant="ghost" onPress={() => setIsSaving((value) => !value)}>
          {isSaving ? t(K.stop_saving) : t(K.start_saving)}
        </Button>
      </li>
    </ul>
  );
}
