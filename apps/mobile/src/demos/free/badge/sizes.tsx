/**
 * Stackra file contract:
 * Purpose: the "sizes" demo of the native Badge: small, medium and large, a one-digit count and a capped one.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Size } from "@stackra/ui/contracts";
import { Avatar, Badge, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { MESSAGES } from "#src/constants/messages.constant";
import { BADGE_DEMO_KEYS } from "#src/demos/free/badge/badge-demo-keys.constant";

/** The demo's keys. */
const K = BADGE_DEMO_KEYS.demo_free.badge.sizes;

/** Each size with "3" and "99+". */
export default function Sizes() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row flex-wrap gap-6 pt-2">
      {Size.map((size) =>
        ["3", "99+"].map((count) => (
          <Sample key={`${size}-${count}`} caption={size}>
            <Badge.Anchor>
              <Avatar name="Ada Lovelace" shape="square" />
              <Badge tone="danger" size={size} label={t(K.label, { size, count })}>
                {count}
              </Badge>
            </Badge.Anchor>
          </Sample>
        )),
      )}
    </View>
  );
}
