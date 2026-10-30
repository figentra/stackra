/**
 * Stackra file contract:
 * Purpose: `useDeliveryAreas()`, the delivery areas the Cascader demos pick from (country, region, district), in the
 *          page's language.
 * Boundary: demo data only; read by the "basics" and "invalid" demos.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (wave D).
 */
import type { TreeViewNode } from "@stackra/ui/contracts";
import { useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { CASCADER_KEYS } from "#src/demos/free/cascader/cascader-keys.constant";

/** The areas' keys. */
const K = CASCADER_KEYS.cascader.areas;

/** The delivery areas as cascader rows. */
export function useDeliveryAreas(): readonly TreeViewNode[] {
  const t = useCatalogueText(MESSAGES.en);
  const row = (id: keyof typeof K & string, children?: readonly TreeViewNode[]): TreeViewNode => ({
    id,
    label: t(K[id]),
    ...(children === undefined ? {} : { children }),
  });
  return [
    row("sa", [
      row("riyadh", [row("olaya"), row("malqa"), row("hittin")]),
      row("jeddah", [row("rawdah"), row("hamra")]),
      row("eastern", [row("dammam"), row("khobar")]),
    ]),
    row("ae", [row("dubai", [row("downtown"), row("marina")]), row("abu_dhabi", [row("reem")])]),
  ];
}
