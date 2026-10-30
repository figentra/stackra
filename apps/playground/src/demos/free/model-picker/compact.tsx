/**
 * Stackra file contract:
 * Purpose: the "compact" demo of the web ModelPicker: an assistant's composer with the picker under the message box,
 *          its label hidden (it still names the field).
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           Model names are product names, never translated.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Card, IconButton, ModelPicker, TextArea, useCatalogueText } from "@stackra/ui/react";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { MODEL_PICKER_KEYS } from "#src/demos/free/model-picker/model-picker-keys.constant";

/** The demo's keys. */
const K = MODEL_PICKER_KEYS.model_picker;

/** ModelPicker: In a composer. */
export default function Compact() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card className="w-full max-w-lg">
      <Card.Content className="grid gap-2">
        <TextArea
          aria-label={t(K.compact.message)}
          placeholder={t(K.compact.placeholder)}
          rows={2}
        />
        <div className="flex items-center justify-between gap-2">
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
        </div>
      </Card.Content>
    </Card>
  );
}
