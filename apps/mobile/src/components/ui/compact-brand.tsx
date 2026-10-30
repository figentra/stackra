/**
 * Stackra file contract:
 * Purpose: `CompactBrand`, the showcase home's brand in the native header's start slot: the st tile and the product's
 *          name (ستاكرا in Arabic). The header follows the app's direction, so it sits on the right in Arabic.
 * Boundary: content only; iOS 26 draws the Liquid Glass capsule around a bar item itself. The name is read as the
 *           header's title.
 * Runtime: react-native
 * Governing contract: STA-1371 (stackra-214, the hero header; owner feedback 2026-10-28: the logo stays in the
 *          header); ADR 0319 (native glass).
 */
import { Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { BRAND_KEYS } from "#src/constants/brand-keys.constant";
import { MESSAGES } from "#src/constants/messages.constant";

import { StTile } from "./st-tile";

/** The home's header brand. */
export function CompactBrand() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row items-center gap-2 px-1" accessible accessibilityRole="header">
      <StTile size={22} />
      <Text type="small" className="font-semibold">
        {t(BRAND_KEYS.brand.name)}
      </Text>
    </View>
  );
}
