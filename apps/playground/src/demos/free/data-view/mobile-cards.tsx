/**
 * Stackra file contract:
 * Purpose: the "mobile-cards" demo of DataView: the same orders in a wide or a narrow frame. Under 600 px of its own
 *          width the table is drawn as cards automatically; widen the frame and the table comes back, with the same
 *          search, filter and sort.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29), wave 4 (mobile cards); ADR 0060 (light, dark, RTL).
 */
import { DataView, SegmentedControl, Text, useCollection } from "@stackra/ui/react";
import { useState } from "react";

import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** DataView: Cards on a narrow screen. */
export default function MobileCards() {
  const { orders, columns, renderCell, t, K } = useGulfOrders(12);
  const [frame, setFrame] = useState<"wide" | "narrow">("narrow");
  const collection = useCollection({ columns, items: orders });
  return (
    <div className="grid gap-3">
      <Text tone="muted">{t(K.mobile_hint)}</Text>
      <SegmentedControl
        label={t(K.frame)}
        size="sm"
        selectedKey={frame}
        onSelectionChange={(key) => setFrame(key === "wide" ? "wide" : "narrow")}
        items={[
          { id: "narrow", label: t(K.frame_narrow) },
          { id: "wide", label: t(K.frame_wide) },
        ]}
      />
      <div className="w-full" style={{ maxInlineSize: frame === "narrow" ? "24rem" : "none" }}>
        <DataView
          label={t(K.mobile_label)}
          collection={collection}
          renderCell={renderCell}
          // The frame, not the window, decides: a 24rem column inside a wide page is narrow.
          style={{ minInlineSize: 0 }}
          cards={{
            title: "customer",
            subtitle: "order",
            meta: "total",
            fields: ["city", "status"],
          }}
        />
      </div>
    </div>
  );
}
