/**
 * Stackra file contract:
 * Purpose: the "control" demo of the native Badge: a count on a button whose own name already says it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Badge, Button, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { BADGE_DEMO_KEYS } from "#src/demos/free/badge/badge-demo-keys.constant";

/** The demo's keys. */
const K = BADGE_DEMO_KEYS.demo_free.badge.control;

/** The badge is not labelled; a press on it reaches the button. */
export default function Control() {
  const [presses, setPresses] = useState(0);
  const t = useCatalogueText(MESSAGES.en);
  const unread = 3 + presses;
  return (
    <View className="flex-row items-center gap-4 pt-2">
      <Badge.Anchor>
        <Button
          variant="secondary"
          label={t(K.label, { count: unread })}
          onPress={() => setPresses((count) => count + 1)}
        >
          {t(K.button)}
        </Button>
        <Badge tone="danger" size="sm">
          {unread}
        </Badge>
      </Badge.Anchor>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(K.presses, { count: presses })}
      </Text>
    </View>
  );
}
