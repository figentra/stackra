/**
 * Stackra file contract:
 * Purpose: the "sizes" demo of the native Avatar: a row per `shape`, each `size` with an image, then with initials.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { AvatarShape, Size } from "@stackra/ui/contracts";
import { Avatar, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { AVATAR_DEMO_KEYS } from "#src/demos/free/avatar/avatar-demo-keys.constant";

/** The demo's keys. */
const K = AVATAR_DEMO_KEYS.demo_free.avatar;

/** A one-pixel slate PNG, so the sample never touches the network; React Native's Image draws no SVG. */
const SAMPLE_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNIKekGAAKjAWRgxqrsAAAAAElFTkSuQmCC";

/** Every size of every shape, image then initials. */
export default function Sizes() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      {AvatarShape.map((shape) => (
        <View key={shape} className="gap-2">
          <Text type="small" tone="muted">
            {t(K.sizes.shape, { shape })}
          </Text>
          <View className="flex-row flex-wrap items-center gap-3">
            {Size.map((size) => (
              <Avatar
                key={`image-${size}`}
                size={size}
                shape={shape}
                src={SAMPLE_IMAGE}
                name="Ada Lovelace"
              />
            ))}
            {Size.map((size) => (
              <Avatar key={`initials-${size}`} size={size} shape={shape} name="Ada Lovelace" />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
