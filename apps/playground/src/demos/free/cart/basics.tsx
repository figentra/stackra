/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Cart block (@stackra/payments): two items whose quantities change, with totals re-priced by the host as the pricing engine would.
 * Boundary: a demo with no props: the kit block, @stackra/ui and local state only; every word from the catalogue and
 *           every price and option as demo data. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0504 (module UI kits).
 */
import { Cart } from "@stackra/payments/react";
import { useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { CART_KEYS } from "#src/demos/free/cart/cart-keys.constant";

/** The demo's keys. */
const K = CART_KEYS.cart.basics;

/** The demo's tax rate and flat shipping, as a market pack would set them. */
const VAT = 0.15;
const SHIPPING = 25;

/** An amount in Saudi riyals. */
const sar = (amount: number) => ({ amount, currency: "SAR" });

/** Cart: two items. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [quantities, setQuantities] = useState<Record<string, number>>({ abaya: 1, scarf: 2 });
  const lines = [
    {
      id: "abaya",
      name: t(K.abaya),
      detail: t(K.abaya_detail),
      unitPrice: { amount: 420, currency: "SAR" },
    },
    {
      id: "scarf",
      name: t(K.scarf),
      detail: t(K.scarf_detail),
      unitPrice: { amount: 95, currency: "SAR" },
    },
  ]
    .filter((line) => (quantities[line.id] ?? 0) > 0)
    .map((line) => ({ ...line, quantity: quantities[line.id] ?? 0, maxQuantity: 5 }));
  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice.amount * line.quantity, 0);
  return (
    <Cart
      className="w-full max-w-md"
      lines={lines}
      totals={[
        { id: "subtotal", label: t(K.subtotal), amount: sar(subtotal) },
        { id: "shipping", label: t(K.shipping), amount: sar(SHIPPING) },
        { id: "vat", label: t(K.vat), amount: sar((subtotal + SHIPPING) * VAT) },
        {
          id: "total",
          label: t(K.total),
          amount: sar((subtotal + SHIPPING) * (1 + VAT)),
          isTotal: true,
        },
      ]}
      onQuantityChange={(id, quantity) => setQuantities((all) => ({ ...all, [id]: quantity }))}
      onRemove={(id) => setQuantities((all) => ({ ...all, [id]: 0 }))}
      onCheckout={() => {}}
      labels={{
        title: t(K.title),
        empty: t(K.empty),
        quantity: (name) => t(K.quantity, { name }),
        remove: t(K.remove),
        checkout: t(K.checkout),
      }}
    />
  );
}
