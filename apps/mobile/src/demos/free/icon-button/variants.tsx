/**
 * Stackra file contract:
 * Purpose: the "variants" demo of the native IconButton: one row per `size`, one button per `variant`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { ButtonVariant, Size } from "@stackra/ui/contracts";
import { IconButton, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";

import { MESSAGES } from "#src/constants/messages.constant";
import { ICON_BUTTON_DEMO_KEYS } from "#src/demos/free/icon-button/icon-button-demo-keys.constant";

/** The demo's keys. */
const K = ICON_BUTTON_DEMO_KEYS.demo_free.icon_button.variants;

/** `label` is required: it is the only name. */
export default function Variants() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      {Size.map((size) => (
        <Sample key={size} caption={t(K.size, { size })}>
          <View className="flex-row flex-wrap gap-2">
            {ButtonVariant.map((variant) => {
              const isDanger = variant.startsWith("danger");
              return (
                <IconButton
                  key={variant}
                  icon={isDanger ? "trash" : "settings"}
                  label={t(isDanger ? K.delete : K.settings, { variant })}
                  variant={variant}
                  size={size}
                />
              );
            })}
          </View>
        </Sample>
      ))}
    </View>
  );
}
