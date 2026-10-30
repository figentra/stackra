/**
 * Stackra file contract:
 * Purpose: the "invalid" demo of the web Cascader: a required delivery area left empty, showing its error until a
 *          district is chosen.
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
const K = CASCADER_KEYS.cascader.invalid;

/** Cascader: Required field. */
export default function Invalid() {
  const t = useCatalogueText(MESSAGES.en);
  const areas = useDeliveryAreas();
  const [area, setArea] = useState<readonly string[]>([]);
  return (
    <div className="w-full max-w-sm">
      <Cascader
        label={t(K.label)}
        items={areas}
        value={area}
        onChange={setArea}
        isRequired
        isInvalid={area.length === 0}
        errorMessage={t(K.error)}
      />
    </div>
  );
}
