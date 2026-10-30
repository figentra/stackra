/**
 * Stackra file contract:
 * Purpose: the "product-grid" demo of the native useBreakpoint: a POS product grid with two tiles a row on a phone,
 *          three on a counter tablet and four on a landscape one, and more products on the larger screens.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); ADR 0060.
 */
import { Card, useBreakpoint, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { USE_BREAKPOINT_DEMO_KEYS } from "#src/demos/free/use-breakpoint/use-breakpoint-demo-keys.constant";

/** The demo's keys. */
const K = USE_BREAKPOINT_DEMO_KEYS.demo_free.use_breakpoint.product_grid;

/** Each tile's width, and how many products show, for each size class. */
const LAYOUT = {
  phone: { width: "w-1/2", shown: 4 },
  tablet: { width: "w-1/3", shown: 6 },
  desktop: { width: "w-1/4", shown: 8 },
} as const;

/** The products on the grid. */
const PRODUCTS = [
  "coffee",
  "croissant",
  "laban",
  "dates",
  "tea",
  "cheese",
  "juice",
  "maamoul",
] as const;

/** Columns that follow the size class. */
export default function ProductGrid() {
  const t = useCatalogueText(MESSAGES.en);
  const { width, shown } = LAYOUT[useBreakpoint().sizeClass];
  return (
    <View className="-m-1.5 flex-row flex-wrap">
      {PRODUCTS.slice(0, shown).map((product) => (
        <View key={product} className={`${width} p-1.5`}>
          <Card>
            <Card.Header>
              <Card.Title>{t(K[product])}</Card.Title>
            </Card.Header>
          </Card>
        </View>
      ))}
    </View>
  );
}
