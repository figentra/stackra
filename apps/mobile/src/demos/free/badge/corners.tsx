/**
 * Stackra file contract:
 * Purpose: the "corners" demo of the native Badge: the four logical corners, each with a labelled dot.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { BadgePlacement } from "@stackra/ui/contracts";
import { Avatar, Badge, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { MESSAGES } from "#src/constants/messages.constant";
import { BADGE_DEMO_KEYS } from "#src/demos/free/badge/badge-demo-keys.constant";

/** The demo's keys. */
const K = BADGE_DEMO_KEYS.demo_free.badge.corners;

/** A dot at each `placement`; `top-end` is top right in English, top left in Arabic. */
export default function Corners() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row flex-wrap gap-6 pt-2">
      {BadgePlacement.map((placement) => (
        <Sample key={placement} caption={placement}>
          <Badge.Anchor>
            <Avatar name="Ada Lovelace" shape="square" />
            <Badge
              tone="accent"
              size="sm"
              placement={placement}
              label={t(K.label, { placement })}
            />
          </Badge.Anchor>
        </Sample>
      ))}
    </View>
  );
}
