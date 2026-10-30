/**
 * Stackra file contract:
 * Purpose: the "external" demo of the native Link: `isExternal` opens the system browser and shows the external mark.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Link, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { LINK_DEMO_KEYS } from "#src/demos/free/link/link-demo-keys.constant";

/** The demo's keys. */
const K = LINK_DEMO_KEYS.demo_free.link.external;

/** The mark sits at the inline end and is read out. */
export default function External() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      <Link href="https://heroui.com" isExternal>
        {t(K.text)}
      </Link>
      <Link href="https://heroui.com" isExternal tone="accent" underline="hover">
        {t(K.text)}
      </Link>
    </View>
  );
}
