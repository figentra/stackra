/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native ActionInputModal (@stackra/panel): a button opens the restock action's
 *          form for one product (a quantity and a note; the product id is filled in), and Confirm runs it once.
 * Boundary: a demo with no props: the modal and `ShopDemoFrame`, which gives it the container, the labels and the
 *           confirmations an app would; local state opens and closes it. Every word from the catalogue. The same file
 *           is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); ADR 0307 (rule 3); ADR 0164 (native parity).
 */
import { ActionInputModal } from "@stackra/panel/native";
import { Button, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { RESOURCE_PAGES_DEMO_KEYS } from "#src/demos/free/resource-list-page/resource-pages-demo-keys.constant";
import { SHOP_REFS } from "#src/demos/free/resource-list-page/shop-refs.constant";
import { ShopDemoFrame } from "#src/components/shop-demo-frame/shop-demo-frame";

/** The demo's keys. */
const K = RESOURCE_PAGES_DEMO_KEYS.demo_free.action_input_modal.basics;

/** Action input modal: restock one product. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [isOpen, setOpen] = useState(false);
  return (
    <ShopDemoFrame>
      <View>
        <Button variant="secondary" onPress={() => setOpen(true)}>
          {t(K.open)}
        </Button>
        <ActionInputModal
          resourceKey="shop.product"
          action={SHOP_REFS.restock}
          idKey="productId"
          ids={["prd_01j9z3k4m5n6p7q8r9s0t1v2wb"]}
          isOpen={isOpen}
          onOpenChange={setOpen}
        />
      </View>
    </ShopDemoFrame>
  );
}
