/**
 * Stackra file contract:
 * Purpose: the "elements" demo of the native InputGroup: an icon before the value, a reveal button after it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Icon, InputGroup, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { INPUT_GROUP_DEMO_KEYS } from "#src/demos/free/input-group/input-group-demo-keys.constant";

/** The demo's keys. */
const K = INPUT_GROUP_DEMO_KEYS.demo_free.input_group.elements;

/** Element affixes: an icon and a button. */
export default function Elements() {
  const [isRevealed, setIsRevealed] = useState(false);
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <InputGroup label={t(K.profile)} prefix={<Icon name="user-round" size="sm" tone="muted" />} />
      <InputGroup
        label={t(K.password)}
        type="password"
        secureTextEntry={!isRevealed}
        suffix={
          <Button
            size="sm"
            variant="ghost"
            label={t(isRevealed ? K.hide_label : K.show_label)}
            onPress={() => setIsRevealed((value) => !value)}
          >
            {t(isRevealed ? K.hide : K.show)}
          </Button>
        }
      />
    </View>
  );
}
