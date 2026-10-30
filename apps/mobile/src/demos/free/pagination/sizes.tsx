/**
 * Stackra file contract:
 * Purpose: the "sizes" demo of the native Pagination: 1,284 orders with a page-size choice and a jump to a page.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Pagination, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PAGINATION_DEMO_KEYS } from "#src/demos/free/pagination/pagination-demo-keys.constant";

/** The demo's keys. */
const K = PAGINATION_DEMO_KEYS.demo_free.pagination.sizes;

/** Pagination: 1,284 orders with a page-size choice and a jump to a page. */
export default function Sizes() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View>
      <Pagination total={1284} pageSizes={[10, 25, 50]} hasJump label={t(K.label)} />
    </View>
  );
}
