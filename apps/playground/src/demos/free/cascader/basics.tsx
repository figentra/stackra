/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Cascader: a delivery area picked country, region and district, starting at
 *          Saudi Arabia / Riyadh / Al Olaya.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Cascader, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { CASCADER_KEYS } from "#src/demos/free/cascader/cascader-keys.constant";
import { useDeliveryAreas } from "#src/demos/free/cascader/use-delivery-areas";

/** The demo's keys. */
const K = CASCADER_KEYS.cascader.basics;

/** Cascader: Delivery area. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const areas = useDeliveryAreas();
  const [area, setArea] = useState<readonly string[]>(["sa", "riyadh", "olaya"]);
  return (
    <div className="w-full max-w-sm">
      <Cascader
        label={t(K.label)}
        description={t(K.description)}
        items={areas}
        value={area}
        onChange={setArea}
      />
    </div>
  );
}
