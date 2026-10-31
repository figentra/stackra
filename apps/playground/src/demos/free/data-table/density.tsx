/**
 * Stackra file contract:
 * Purpose: the "density" demo of the web DataTable: the same orders compact, normal and roomy, picked with a segmented control; the density changes the row height and padding.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29); ADR 0060 (light, dark, RTL).
 */
import type { CollectionDensity } from "@stackra/ui/contracts";
import { DataTable, SegmentedControl, useCollection } from "@stackra/ui/react";

import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** The densities. */
const DENSITIES: readonly CollectionDensity[] = ["compact", "normal", "roomy"];

/** Data table: Density. */
export default function Density() {
  const { orders, columns, renderCell, t, K } = useGulfOrders(8);
  const collection = useCollection({
    columns,
    items: orders,
    initialState: {
      density: "compact",
      // The totals in view: the long text columns are hidden.
      columns: columns.map((column) => ({
        id: column.id,
        isHidden: ["city", "product", "channel", "date"].includes(column.id),
      })),
    },
  });
  return (
    <div className="grid gap-3">
      <SegmentedControl
        label={t(K.density)}
        size="sm"
        selectedKey={collection.state.density}
        onSelectionChange={(key) => {
          const next = DENSITIES.find((density) => density === key);
          if (next) collection.setDensity(next);
        }}
        items={DENSITIES.map((density) => ({ id: density, label: t(K[`density_${density}`]) }))}
      />
      <DataTable label={t(K.density_label)} collection={collection} renderCell={renderCell} />
    </div>
  );
}
