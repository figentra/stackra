/**
 * Stackra file contract:
 * Purpose: the "persistence" demo of DataView: the engine keeps the columns, sort, filter, group, density, layout and saved views in this browser under a collection key, so a reload brings the layout back; a button forgets it.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29); ADR 0060 (light, dark, RTL).
 */
import { Button, DataView, Text, useCollection } from "@stackra/ui/react";
import { useState } from "react";

import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** The key the layout persists under. */
const KEY = "playground.orders.persistence";

/** The DataView demo: persistence. */
export default function Persistence() {
  const [mount, setMount] = useState(0);
  return <Saved key={mount} onForget={() => setMount((count) => count + 1)} />;
}

/** The persisted DataView; forgetting clears the entry and mounts it afresh. */
function Saved({ onForget }: { readonly onForget: () => void }) {
  const { orders, columns, renderCell, t, K } = useGulfOrders();
  const collection = useCollection({ columns, items: orders, collectionKey: KEY, paging: "page" });
  return (
    <div className="grid gap-3">
      <Text tone="muted">{t(K.persistence_hint)}</Text>
      <DataView label={t(K.persistence_label)} collection={collection} renderCell={renderCell} />
      <div>
        <Button
          variant="secondary"
          size="sm"
          onPress={() => {
            try {
              window.localStorage.removeItem(`stackra.collection.${KEY}`);
            } catch {
              // Storage may be off; the demo still remounts.
            }
            onForget();
          }}
        >
          {t(K.persistence_reset)}
        </Button>
      </div>
    </div>
  );
}
