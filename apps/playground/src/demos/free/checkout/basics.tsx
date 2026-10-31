/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Checkout block (@stackra/payments): a Saudi checkout: contact and address fields as a market pack would list them, shipping re-pricing the totals, and two payment methods.
 * Boundary: a demo with no props: the kit block, @stackra/ui and local state only; every word from the catalogue and
 *           every price and option as demo data. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0503 (module UI kits).
 */
import { Checkout } from "@stackra/payments/react";
import { Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { CHECKOUT_KEYS } from "#src/demos/free/checkout/checkout-keys.constant";

/** The demo's keys. */
const K = CHECKOUT_KEYS.checkout.basics;

/** The demo's tax rate, as a market pack would set it. */
const VAT = 0.15;

/** An amount in Saudi riyals. */
const sar = (amount: number) => ({ amount, currency: "SAR" });

/** Checkout: one page. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [shipping, setShipping] = useState("standard");
  const [placed, setPlaced] = useState("");
  const options = [
    { id: "standard", label: t(K.standard), description: t(K.standard_line), price: sar(0) },
    { id: "express", label: t(K.express), description: t(K.express_line), price: sar(35) },
  ];
  const methods = [
    { id: "card", label: t(K.card), description: t(K.card_line) },
    { id: "cod", label: t(K.cod) },
  ];
  const subtotal = 610;
  const delivery = options.find((option) => option.id === shipping)?.price.amount ?? 0;
  return (
    <div className="grid w-full gap-4">
      <Checkout
        sections={[
          {
            id: "contact",
            title: t(K.contact),
            fields: [
              { id: "email", label: t(K.email), type: "email", isRequired: true },
              { id: "phone", label: t(K.phone), type: "tel", isRequired: true },
            ],
          },
          {
            id: "address",
            title: t(K.address),
            fields: [
              { id: "name", label: t(K.name), isRequired: true },
              { id: "street", label: t(K.street), isRequired: true },
              { id: "district", label: t(K.district) },
              { id: "city", label: t(K.city), isRequired: true },
            ],
          },
        ]}
        shippingOptions={options}
        paymentMethods={methods}
        shipping={shipping}
        onShippingChange={setShipping}
        lines={[
          { id: "abaya", name: t(K.abaya), quantity: 1, amount: sar(420) },
          { id: "scarf", name: t(K.scarf), quantity: 2, amount: sar(190) },
        ]}
        totals={[
          { id: "subtotal", label: t(K.subtotal), amount: sar(subtotal) },
          { id: "shipping", label: t(K.shipping), amount: sar(delivery) },
          { id: "vat", label: t(K.vat), amount: sar((subtotal + delivery) * VAT) },
          {
            id: "total",
            label: t(K.total),
            amount: sar((subtotal + delivery) * (1 + VAT)),
            isTotal: true,
          },
        ]}
        labels={{
          shipping: t(K.shipping),
          payment: t(K.payment),
          summary: t(K.summary),
          placeOrder: t(K.place),
        }}
        onSubmit={(values) =>
          setPlaced(
            t(K.placed, {
              shipping: options.find((option) => option.id === values.shipping)?.label ?? "",
              payment: methods.find((method) => method.id === values.payment)?.label ?? "",
            }),
          )
        }
      />
      <Text tone="success" type="small" role="status">
        {placed}
      </Text>
    </div>
  );
}
