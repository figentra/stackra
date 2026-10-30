/**
 * Stackra file contract:
 * Purpose: the "cart-count" demo of the web VisuallyHidden: a POS cart button whose badge shows a bare number and
 *          whose name says "3 items in the cart", in the reader's language and plural.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Badge, Button, useCatalogueText, VisuallyHidden } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { VISUALLY_HIDDEN_KEYS } from "#src/demos/free/visually-hidden/visually-hidden-keys.constant";

/** The demo's keys. */
const K = VISUALLY_HIDDEN_KEYS.visually_hidden;

/** VisuallyHidden: Cart count. */
export default function CartCount() {
  const t = useCatalogueText(MESSAGES.en);
  const [count, setCount] = useState(3);
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Badge.Anchor>
        <Button variant="secondary">
          {t(K.cart)}
          <VisuallyHidden>{t(K.items_in_cart, { count })}</VisuallyHidden>
        </Button>
        <Badge tone="accent">{count}</Badge>
      </Badge.Anchor>
      <Button variant="ghost" onPress={() => setCount(count + 1)}>
        {t(K.add_item)}
      </Button>
    </div>
  );
}
