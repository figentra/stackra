/**
 * Stackra file contract:
 * Purpose: the "forms" demo of the native CloseButton: the default mark, an `icon` of your own, and `isDisabled`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { CloseButton, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";

import { MESSAGES } from "#src/constants/messages.constant";
import { CLOSE_BUTTON_DEMO_KEYS } from "#src/demos/free/close-button/close-button-demo-keys.constant";

/** The demo's keys. */
const K = CLOSE_BUTTON_DEMO_KEYS.demo_free.close_button.forms;

/** `label` is required: it is the only name. */
export default function Forms() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row flex-wrap gap-6">
      <Sample caption="default">
        <CloseButton label={t(K.default)} />
      </Sample>
      <Sample caption="icon">
        <CloseButton label={t(K.custom)} icon="circle-x" />
      </Sample>
      <Sample caption="isDisabled">
        <CloseButton label={t(K.disabled)} isDisabled />
      </Sample>
    </View>
  );
}
