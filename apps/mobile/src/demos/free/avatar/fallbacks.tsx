/**
 * Stackra file contract:
 * Purpose: the "fallbacks" demo of the native Avatar: an image, a broken image that falls back to initials, an icon, no name.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Avatar, Icon, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { MESSAGES } from "#src/constants/messages.constant";
import { AVATAR_DEMO_KEYS } from "#src/demos/free/avatar/avatar-demo-keys.constant";

/** The demo's keys. */
const K = AVATAR_DEMO_KEYS.demo_free.avatar.fallbacks;

/** A one-pixel slate PNG, so the sample never touches the network; React Native's Image draws no SVG. */
const SAMPLE_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNIKekGAAKjAWRgxqrsAAAAAElFTkSuQmCC";

/** A URL that is not an image, so the avatar falls back to its initials. */
const BROKEN_IMAGE = "https://invalid.example/missing-avatar.png";

/** Each fallback, captioned. */
export default function Fallbacks() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row flex-wrap items-start gap-4">
      <Sample caption={t(K.loaded)}>
        <Avatar src={SAMPLE_IMAGE} name="Ada Lovelace" />
      </Sample>
      <Sample caption={t(K.broken)}>
        <Avatar src={BROKEN_IMAGE} name="Ada Lovelace" />
      </Sample>
      <Sample caption={t(K.organisation)}>
        <Avatar
          shape="square"
          tone="accent"
          variant="soft"
          name="Figentra"
          fallback={<Icon name="user-round" />}
        />
      </Sample>
      <Sample caption={t(K.anonymous)}>
        <Avatar />
      </Sample>
    </View>
  );
}
