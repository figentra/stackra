/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native Button: each variant default, disabled and loading.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { ButtonVariant } from "@stackra/ui/contracts";
import { Button, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { BUTTON_KEYS } from "#src/constants/button-keys.constant";
import { MESSAGES } from "#src/constants/messages.constant";

/** The demo's keys. */
const K = BUTTON_KEYS.button.states;

/** Each variant default, `isDisabled` and `isLoading`. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      {ButtonVariant.map((variant) => (
        <View key={variant} className="gap-2">
          <Text type="small" tone="muted">
            {variant}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <Button variant={variant}>{t(K.default)}</Button>
            <Button variant={variant} isDisabled>
              {t(K.disabled)}
            </Button>
            <Button variant={variant} isLoading>
              {t(K.loading)}
            </Button>
          </View>
        </View>
      ))}
    </View>
  );
}
