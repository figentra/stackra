/**
 * Stackra file contract:
 * Purpose: the "tones" demo of the native Avatar: a row per `variant`, the initials in each `tone`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Enum, Tone } from "@stackra/contracts";
import { AvatarVariant } from "@stackra/ui/contracts";
import { Avatar, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { MESSAGES } from "#src/constants/messages.constant";
import { AVATAR_DEMO_KEYS } from "#src/demos/free/avatar/avatar-demo-keys.constant";

/** The demo's keys. */
const K = AVATAR_DEMO_KEYS.demo_free.avatar;

/** Every tone of every variant. */
export default function Tones() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      {AvatarVariant.map((variant) => (
        <View key={variant} className="gap-2">
          <Text type="small" tone="muted">
            {t(K.tones.variant, { variant })}
          </Text>
          <View className="flex-row flex-wrap items-center gap-3">
            {Enum.values(Tone).map((tone) => (
              <Sample key={tone} caption={tone}>
                <Avatar tone={tone} variant={variant} name="Ada Lovelace" />
              </Sample>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
