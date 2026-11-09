/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native ResourceFormPage (@stackra/panel): the Create form of the demo shop's
 *          products, drawn from the create action's input (a name, a stock count and a status select), validated by its
 *          schema and saved through the action runner with a success toast.
 * Boundary: a demo with no props: the page and `ShopDemoFrame`, which gives it the container, the labels and the
 *           confirmations an app would. Saving opens the list by name; the showcase registers no such screen, so the
 *           form stays. Every word from the catalogue. The same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); ADR 0307; ADR 0164 (native parity).
 */
import { resource } from "@stackra/panel";
import { ResourceFormPage } from "@stackra/panel/native";

import { SHOP_REFS } from "#src/demos/free/resource-list-page/shop-refs.constant";
import { ShopDemoFrame } from "#src/components/shop-demo-frame/shop-demo-frame";

/** The products resource, as gen writes it into an app's `#stackra/resources`. */
const Products = resource("shop.product", { base: "/shop/products", create: SHOP_REFS.create });

/** Resource form: create a product. */
export default function Basics() {
  return (
    <ShopDemoFrame>
      <ResourceFormPage resource={Products} mode="create" />
    </ShopDemoFrame>
  );
}
