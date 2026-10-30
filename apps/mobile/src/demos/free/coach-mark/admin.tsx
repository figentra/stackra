/**
 * Stackra file contract:
 * Purpose: the "admin" demo of the native CoachMark: a tour of the admin's menu; in Arabic the beacon sits on the inline-end corner, which is the left.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); GAPS.md
 *          row 39 (owner decision 2026-10-28).
 */
import { Button, CoachMark, Text, useCatalogueText } from "@stackra/ui/native";
import { useRef, useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { COACH_MARK_DEMO_KEYS } from "#src/demos/free/coach-mark/coach-mark-demo-keys.constant";

/** The demo's keys. */
const K = COACH_MARK_DEMO_KEYS.demo_free.coach_mark;

/** A tour of three menu rows. */
export default function Admin() {
  const t = useCatalogueText(MESSAGES.en);
  const [isOpen, setOpen] = useState(false);
  const orders = useRef<View>(null);
  const products = useRef<View>(null);
  const reports = useRef<View>(null);
  return (
    <View className="gap-3">
      <Button size="sm" variant="secondary" className="self-start" onPress={() => setOpen(true)}>
        {t(K.start)}
      </Button>
      <View className="border border-separator">
        <View ref={orders} collapsable={false} className="px-4 py-3">
          <Text>{t(K.admin.orders)}</Text>
        </View>
        <View ref={products} collapsable={false} className="px-4 py-3">
          <Text>{t(K.admin.products)}</Text>
        </View>
        <View ref={reports} collapsable={false} className="px-4 py-3">
          <Text>{t(K.admin.reports)}</Text>
        </View>
      </View>
      <CoachMark
        isOpen={isOpen}
        onOpenChange={setOpen}
        steps={[
          {
            id: "orders",
            target: orders,
            title: t(K.admin.orders_title),
            description: t(K.admin.orders_text),
          },
          {
            id: "products",
            target: products,
            title: t(K.admin.products_title),
            description: t(K.admin.products_text),
          },
          {
            id: "reports",
            target: reports,
            title: t(K.admin.reports_title),
            description: t(K.admin.reports_text),
          },
        ]}
      />
    </View>
  );
}
