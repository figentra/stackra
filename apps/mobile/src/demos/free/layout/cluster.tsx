/**
 * Stackra file contract:
 * Purpose: the "cluster" demo of the native layout primitives: an order's tags in a row that wraps.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave C).
 */
import { Chip, Cluster, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { LAYOUT_DEMO_KEYS } from "#src/demos/free/layout/layout-demo-keys.constant";

/** The demo's keys. */
const K = LAYOUT_DEMO_KEYS.demo_free.layout.cluster;

/** Cluster: tags that wrap. */
export default function ClusterDemo() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Cluster accessibilityLabel={t(K.label)}>
      {[K.new, K.delivery, K.gift, K.city, K.mada, K.express].map((key) => (
        <Chip key={key} size="sm">
          {t(key)}
        </Chip>
      ))}
    </Cluster>
  );
}
