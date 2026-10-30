/**
 * Stackra file contract:
 * Purpose: the "container" demo of the web Address field: the same field in a narrow column and in a wide one on
 *          one screen; each lays out by its own width (a container query), not the screen's.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (AddressField container
 *          query); ADR 0060 (light, dark, RTL).
 */
import { AddressField, Text, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { ADDRESS_FIELD_KEYS } from "#src/demos/free/address-field/address-field-keys.constant";

/** The demo's keys. */
const K = ADDRESS_FIELD_KEYS.address_field.container;

/** Address field: In a narrow or wide column. */
export default function Container() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid w-full gap-8">
      <div className="grid max-w-64 content-start gap-2">
        <Text tone="muted">{t(K.narrow)}</Text>
        <AddressField label={t(K.billing)} />
      </div>
      <div className="grid content-start gap-2">
        <Text tone="muted">{t(K.wide)}</Text>
        <AddressField label={t(K.shipping)} />
      </div>
    </div>
  );
}
