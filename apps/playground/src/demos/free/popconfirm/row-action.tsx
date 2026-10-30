/**
 * Stackra file contract:
 * Purpose: the "row-action" demo of the web Popconfirm: a short product list whose rows each have a delete icon that
 *          asks first, named for its product.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { IconButton, Popconfirm, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { POPCONFIRM_KEYS } from "#src/demos/free/popconfirm/popconfirm-keys.constant";

/** The demo's keys. */
const K = POPCONFIRM_KEYS.popconfirm.row_action;

/** The products, by key and price (prices are numbers, not words). */
const PRODUCTS = [
  { id: "abaya", price: 420 },
  { id: "thobe", price: 260 },
  { id: "shemagh", price: 95 },
] as const;

/** Popconfirm: In a table row. */
export default function RowAction() {
  const t = useCatalogueText(MESSAGES.en);
  const [rows, setRows] = useState<readonly string[]>(PRODUCTS.map((product) => product.id));
  const shown = PRODUCTS.filter((product) => rows.includes(product.id));
  return (
    <div className="grid w-full max-w-md gap-2">
      <Text className="font-medium">{t(K.heading)}</Text>
      {shown.length === 0 ? <Text tone="muted">{t(K.empty)}</Text> : null}
      <ul
        style={{ borderRadius: "var(--radius-container)" }}
        className="divide-y divide-separator border border-separator"
      >
        {shown.map((product) => {
          const name = t(K[product.id]);
          return (
            <li key={product.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="grid">
                <Text>{name}</Text>
                <Text tone="muted" type="small">
                  {t(K.price, { price: product.price })}
                </Text>
              </div>
              <Popconfirm
                trigger={<IconButton icon="trash" label={t(K.delete, { name })} variant="ghost" />}
                title={t(K.title, { name })}
                confirmLabel={t(K.confirm)}
                tone="danger"
                placement="start"
                onConfirm={() => setRows(rows.filter((id) => id !== product.id))}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
