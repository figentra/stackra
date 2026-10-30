/**
 * Stackra file contract:
 * Purpose: the "lazy" demo of the native Cascader: a product category whose sub-levels load from the server the first
 *          time they are opened.
 * Boundary: a demo with no props, @stackra/ui only; the server is a timer. The same file is the preview and the code
 *           shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { TreeViewNode } from "@stackra/ui/contracts";
import { Cascader, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CASCADER_DEMO_KEYS } from "#src/demos/free/cascader/cascader-demo-keys.constant";

/** The demo's keys. */
const K = CASCADER_DEMO_KEYS.demo_free.cascader.lazy;

/** The rows under each top category, as the server would send them. */
const BELOW: Readonly<Record<string, readonly (keyof typeof K & string)[]>> = {
  women: ["abayas", "dresses"],
  men: ["thobes", "shoes"],
};

/** Cascader: Load levels on demand. */
export default function Lazy() {
  const t = useCatalogueText(MESSAGES.en);
  const row = (id: keyof typeof K & string): TreeViewNode => ({
    id,
    label: t(K[id]),
    ...(BELOW[id] ? { hasChildren: true } : {}),
  });
  const load = (id: string) =>
    new Promise<readonly TreeViewNode[]>((done) => {
      setTimeout(() => done((BELOW[id] ?? []).map(row)), 800);
    });
  return (
    <Cascader
      label={t(K.label)}
      description={t(K.description)}
      items={[row("women"), row("men")]}
      onLoadChildren={load}
    />
  );
}
