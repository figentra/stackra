/**
 * Stackra file contract:
 * Purpose: the "mixed-text" demo of the web Bidi: a POS customer card whose phone, e-mail and SKU keep their order in
 *          Arabic, and a sentence that isolates the SKU it interpolates with `isolateText`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { isolateText } from "@stackra/ui";
import { Bidi, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { BIDI_KEYS } from "#src/demos/free/bidi/bidi-keys.constant";

/** The demo's keys. */
const K = BIDI_KEYS.bidi;

/** A customer's details as the POS stores them (data, never translated). */
const CUSTOMER = {
  name: "ليلى أحمد",
  phone: "+966 55 123 4567",
  email: "layla.ahmed@example.com",
  sku: "SKU-104-B",
} as const;

/** Bidi: Mixed text. */
export default function MixedText() {
  const t = useCatalogueText(MESSAGES.en);
  const rows = [
    [t(K.customer), <Bidi key="name">{CUSTOMER.name}</Bidi>],
    [
      t(K.phone),
      <Bidi key="phone" dir="ltr">
        {CUSTOMER.phone}
      </Bidi>,
    ],
    [
      t(K.email),
      <Bidi key="email" dir="ltr">
        {CUSTOMER.email}
      </Bidi>,
    ],
    [
      t(K.sku),
      <Bidi key="sku" dir="ltr">
        {CUSTOMER.sku}
      </Bidi>,
    ],
  ] as const;
  return (
    <div className="grid max-w-md gap-4">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <Text>{t(K.order_ready, { sku: isolateText(CUSTOMER.sku, "ltr") })}</Text>
    </div>
  );
}
