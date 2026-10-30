/**
 * Stackra file contract:
 * Purpose: the "cluster" demo of the web layout primitives: an order's tags in a row that wraps in a narrow card.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave C).
 */
import { Chip, Cluster, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { LAYOUT_KEYS } from "#src/demos/free/layout/layout-keys.constant";

/** The demo's keys. */
const K = LAYOUT_KEYS.layout.cluster;

/** Cluster: tags that wrap. */
export default function ClusterDemo() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Cluster aria-label={t(K.label)} role="group" className="w-full max-w-xs">
      {[K.new, K.delivery, K.gift, K.city, K.mada, K.express].map((key) => (
        <Chip key={key} size="sm">
          {t(key)}
        </Chip>
      ))}
    </Cluster>
  );
}
