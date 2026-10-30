/**
 * Stackra file contract:
 * Purpose: the "variants" demo of the native CopyButton: each button variant and size.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6);
 *          design-system gap inventory row 35.
 */
import { CopyButton, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { MESSAGES } from "#src/constants/messages.constant";
import { COPY_BUTTON_DEMO_KEYS } from "#src/demos/free/copy-button/copy-button-demo-keys.constant";

/** The demo's keys. */
const K = COPY_BUTTON_DEMO_KEYS.demo_free.copy_button.variants;

/** Each variant in each size. */
export default function Variants() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      {(["ghost", "secondary", "tertiary"] as const).map((variant) => (
        <Sample key={variant} caption={t(K.variant, { variant })}>
          <View className="flex-row items-center gap-2">
            {(["sm", "md", "lg"] as const).map((size) => (
              <CopyButton key={size} value="SKU-55821" variant={variant} size={size} />
            ))}
          </View>
        </Sample>
      ))}
    </View>
  );
}
