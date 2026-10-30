/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native InputGroup: a page address whose preview follows the slug as it is typed.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { InputGroup, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { INPUT_GROUP_DEMO_KEYS } from "#src/demos/free/input-group/input-group-demo-keys.constant";

/** The demo's keys. */
const K = INPUT_GROUP_DEMO_KEYS.demo_free.input_group.live;

/** Type a slug; the full address follows. */
export default function Live() {
  const [slug, setSlug] = useState("pricing");
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      <InputGroup
        label={t(K.label)}
        description={t(K.hint)}
        prefix="/"
        type="url"
        value={slug}
        onChange={setSlug}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {`https://figentra.com/${slug}`}
      </Text>
    </View>
  );
}
