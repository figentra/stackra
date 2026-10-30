/**
 * Stackra file contract:
 * Purpose: the "surfaces" demo of the native List: `variant`, the surface level the rows sit on.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { SurfaceVariant, type ListItemData } from "@stackra/ui/contracts";
import { List, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { LIST_DEMO_KEYS } from "#src/demos/free/list/list-demo-keys.constant";

/** The demo's keys. */
const K = LIST_DEMO_KEYS.demo_free.list;

/** One list per surface level. */
export default function Surfaces() {
  const t = useCatalogueText(MESSAGES.en);
  const orders: readonly ListItemData[] = [
    { id: "1042", title: t(K.orders.order, { id: "1042" }), description: t(K.orders.shipped) },
    { id: "1043", title: t(K.orders.order, { id: "1043" }), description: t(K.orders.waiting) },
  ];
  return (
    <View className="gap-4">
      {SurfaceVariant.map((variant) => (
        <List
          scrollEnabled={false}
          key={variant}
          label={t(K.surfaces.label, { variant })}
          items={orders}
          variant={variant}
        />
      ))}
    </View>
  );
}
