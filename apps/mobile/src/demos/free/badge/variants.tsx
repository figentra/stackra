/**
 * Stackra file contract:
 * Purpose: the "variants" demo of the native Badge: a row per `variant`, an anchor per `tone`, each badge labelled.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Enum, Tone } from "@stackra/contracts";
import { BadgeVariant } from "@stackra/ui/contracts";
import { Avatar, Badge, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { MESSAGES } from "#src/constants/messages.constant";
import { BADGE_DEMO_KEYS } from "#src/demos/free/badge/badge-demo-keys.constant";

/** The demo's keys. */
const K = BADGE_DEMO_KEYS.demo_free.badge.variants;

/** Every tone of every variant, on an avatar. */
export default function Variants() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      {BadgeVariant.map((variant) => (
        <Sample key={variant} caption={variant}>
          <View className="flex-row flex-wrap gap-5 pt-2">
            {Enum.values(Tone).map((tone) => (
              <Badge.Anchor key={tone}>
                <Avatar name="Ada Lovelace" shape="square" />
                <Badge tone={tone} variant={variant} label={t(K.label, { tone, variant })}>
                  {5}
                </Badge>
              </Badge.Anchor>
            ))}
          </View>
        </Sample>
      ))}
    </View>
  );
}
