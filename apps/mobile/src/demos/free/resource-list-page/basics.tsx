/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native ResourceListPage (@stackra/panel): the demo shop's products as a list with
 *          search, cursor paging and pull to refresh, read through the shop's list query.
 * Boundary: a demo with no props: the page and `ShopDemoFrame`, which gives it the container, the labels and the
 *           confirmations an app would; the resource declares only its list, so no button leaves the demo. Every word
 *           from the catalogue. The same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); ADR 0307; ADR 0164 (native parity).
 */
import { resource } from "@stackra/panel";
import { ResourceListPage } from "@stackra/panel/native";

import { SHOP_REFS } from "#src/demos/free/resource-list-page/shop-refs.constant";
import { ShopDemoFrame } from "#src/components/shop-demo-frame/shop-demo-frame";

/** The products resource, as gen writes it into an app's `#stackra/resources`. */
const Products = resource("shop.product", { base: "/shop/products", list: SHOP_REFS.list });

/** Resource list: the shop's products. */
export default function Basics() {
  return (
    <ShopDemoFrame>
      <ResourceListPage resource={Products} pageSize={10} />
    </ShopDemoFrame>
  );
}
