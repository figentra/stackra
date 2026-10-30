/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native Avatar: step through names and turn the image on or off.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Avatar, Button, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { AVATAR_DEMO_KEYS } from "#src/demos/free/avatar/avatar-demo-keys.constant";

/** The demo's keys. */
const K = AVATAR_DEMO_KEYS.demo_free.avatar.live;

/** A one-pixel slate PNG, so the sample never touches the network; React Native's Image draws no SVG. */
const SAMPLE_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNIKekGAAKjAWRgxqrsAAAAAElFTkSuQmCC";

/** The names the sample cycles through (never translated). */
const NAMES = ["Ada Lovelace", "Plato", "émile zola", "ليلى أحمد"] as const;

/** Next name and the image toggle change one avatar. */
export default function Live() {
  const [nameIndex, setNameIndex] = useState(0);
  const [hasImage, setHasImage] = useState(false);
  const t = useCatalogueText(MESSAGES.en);
  const current = NAMES[nameIndex % NAMES.length] ?? NAMES[0];
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        <Button size="sm" variant="secondary" onPress={() => setNameIndex((index) => index + 1)}>
          {t(K.next_name)}
        </Button>
        <Button size="sm" variant="secondary" onPress={() => setHasImage((value) => !value)}>
          {t(hasImage ? K.image_off : K.image_on)}
        </Button>
      </View>
      <View className="flex-row items-center gap-3">
        <Avatar
          size="lg"
          name={current}
          label={t(K.current)}
          {...(hasImage ? { src: SAMPLE_IMAGE } : {})}
        />
        <Text accessibilityLiveRegion="polite">{current}</Text>
      </View>
    </View>
  );
}
