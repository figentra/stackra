/**
 * Stackra file contract:
 * Purpose: the "json" demo of the web CodeBlock: a json payload.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { JsonViewer, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CODE_BLOCK_KEYS } from "#src/demos/free/code-block/code-block-keys.constant";

/** The demo's keys. */
const K = CODE_BLOCK_KEYS.code_block;

/** A webhook body. */
const PAYLOAD = {
  event: "order.paid",
  order: {
    id: "ord_2048",
    total: 186.5,
    currency: "SAR",
    lines: [{ sku: "BEAN-250", quantity: 2 }],
  },
  test: false,
  coupon: null,
};

/** Code block: a JSON payload that folds. */
export default function Json() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <JsonViewer className="w-full" label={t(K.label)} value={PAYLOAD} defaultExpandDepth={2} />
  );
}
