/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native ResourceViewPage (@stackra/panel): one product of the demo shop, read
 *          through its get query, its fields as a property list with the status by its label, and pull to refresh.
 * Boundary: a demo with no props: the page and `ShopDemoFrame`, which gives it the container, the labels and the
 *           confirmations an app would; the id is the one a host screen would take from its params. Every word from the
 *           catalogue. The same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); ADR 0307; ADR 0164 (native parity).
 */
import { resource } from "@stackra/panel";
import { ResourceViewPage } from "@stackra/panel/native";

import { SHOP_REFS } from "#src/demos/free/resource-list-page/shop-refs.constant";
import { ShopDemoFrame } from "#src/components/shop-demo-frame/shop-demo-frame";

/** The products resource, as gen writes it into an app's `#stackra/resources`. */
const Products = resource("shop.product", { base: "/shop/products", view: SHOP_REFS.get });

/** Resource view: one product. */
export default function Basics() {
  return (
    <ShopDemoFrame>
      <ResourceViewPage resource={Products} id="prd_01j9z3k4m5n6p7q8r9s0t1v2wa" />
    </ShopDemoFrame>
  );
}
