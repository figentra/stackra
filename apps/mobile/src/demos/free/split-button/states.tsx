/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native Split button: a disabled pair, and a loading one whose caret is refused while it runs.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { MenuSection } from "@stackra/ui/contracts";
import { Button, SplitButton, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SPLIT_BUTTON_DEMO_KEYS } from "#src/demos/free/split-button/split-button-demo-keys.constant";

/** The demo's keys. */
const K = SPLIT_BUTTON_DEMO_KEYS.demo_free.split_button.sample;

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
    <View className="items-start gap-3">
      <SplitButton menuLabel={t(K.more_save_options)} sections={sections} isDisabled>
        {t(K.save)}
      </SplitButton>
      <Text type="small" tone="muted">
        {t(K.disabled)}
      </Text>
      <SplitButton menuLabel={t(K.more_save_options)} sections={sections} isLoading={isSaving}>
        {t(K.save)}
      </SplitButton>
      <Button size="sm" variant="ghost" onPress={() => setIsSaving((value) => !value)}>
        {isSaving ? t(K.stop_saving) : t(K.start_saving)}
      </Button>
    </View>
  );
}
