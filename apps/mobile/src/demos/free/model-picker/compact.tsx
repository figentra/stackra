/**
 * Stackra file contract:
 * Purpose: the "compact" demo of the native ModelPicker: an assistant's composer with the picker under the message
 *          box, its label hidden (it still names the field).
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown. Model names are
 *           product names, never translated.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Card, IconButton, ModelPicker, TextArea, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { MODEL_PICKER_DEMO_KEYS } from "#src/demos/free/model-picker/model-picker-demo-keys.constant";

/** The demo's keys. */
const K = MODEL_PICKER_DEMO_KEYS.demo_free.model_picker;

/** ModelPicker: In a composer. */
export default function Compact() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card>
      <Card.Content className="gap-2">
        <TextArea
          accessibilityLabel={t(K.compact.message)}
          placeholder={t(K.compact.placeholder)}
          rows={2}
        />
        <View className="flex-row items-center justify-between gap-2">
          <ModelPicker
            label={t(K.compact.label)}
            isLabelVisible={false}
            defaultValue="swift"
            models={[
              {
                id: "swift",
                name: "Najm Swift",
                provider: "Najm",
                description: t(K.basics.swift),
                capabilities: [t(K.basics.fast)],
              },
              {
                id: "deep",
                name: "Najm Deep",
                provider: "Najm",
                description: t(K.basics.deep),
                capabilities: [t(K.basics.reasoning)],
                badge: "new",
              },
            ]}
          />
          <IconButton icon={Icons.SendHorizontal} label={t(K.compact.send)} />
        </View>
      </Card.Content>
    </Card>
  );
}
