/**
 * Stackra file contract:
 * Purpose: the "json" demo of the native CodeBlock: a json payload.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (wave 3b).
 */
import { JsonViewer, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CODE_BLOCK_DEMO_KEYS } from "#src/demos/free/code-block/code-block-demo-keys.constant";

/** The demo's keys. */
const K = CODE_BLOCK_DEMO_KEYS.demo_free.code_block.json;

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

/** A JSON payload that folds. */
export default function Json() {
  const t = useCatalogueText(MESSAGES.en);
  return <JsonViewer label={t(K.label)} value={PAYLOAD} defaultExpandDepth={2} />;
}
