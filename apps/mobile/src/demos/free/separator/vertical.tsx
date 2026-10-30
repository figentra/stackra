/**
 * Stackra file contract:
 * Purpose: the "vertical" demo of the native Separator: `orientation="vertical"` between links; it follows the row's height.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Link, Separator, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SEPARATOR_DEMO_KEYS } from "#src/demos/free/separator/separator-demo-keys.constant";

/** The demo's keys. */
const K = SEPARATOR_DEMO_KEYS.demo_free.separator.vertical;

/** The links of the row. */
const LINKS = ["pricing", "docs", "support"] as const;

/** Rules between links in a row. */
export default function Vertical() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row items-center gap-3 self-start">
      {LINKS.map((link, index) => (
        <View key={link} className="flex-row items-center gap-3 self-stretch">
          {index > 0 ? <Separator orientation="vertical" /> : null}
          <Link underline="hover" href="https://heroui.com">
            {t(K[link])}
          </Link>
        </View>
      ))}
    </View>
  );
}
