/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Cascader: a delivery area picked country, city and district in a
 *          drill-down sheet, starting at Saudi Arabia / Riyadh / Al Olaya.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Cascader, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { CASCADER_DEMO_KEYS } from "#src/demos/free/cascader/cascader-demo-keys.constant";

/** The demo's keys. */
const K = CASCADER_DEMO_KEYS.demo_free.cascader.basics;

/** Cascader: Delivery area. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [area, setArea] = useState<readonly string[]>(["sa", "riyadh", "olaya"]);
  return (
    <Cascader
      label={t(K.label)}
      description={t(K.description)}
      value={area}
      onChange={setArea}
      items={[
        {
          id: "sa",
          label: t(K.sa),
          children: [
            {
              id: "riyadh",
              label: t(K.riyadh),
              children: [
                { id: "olaya", label: t(K.olaya) },
                { id: "malqa", label: t(K.malqa) },
              ],
            },
            { id: "jeddah", label: t(K.jeddah), children: [{ id: "rawdah", label: t(K.rawdah) }] },
          ],
        },
        {
          id: "ae",
          label: t(K.ae),
          children: [
            { id: "dubai", label: t(K.dubai), children: [{ id: "marina", label: t(K.marina) }] },
          ],
        },
      ]}
    />
  );
}
