/**
 * Stackra file contract:
 * Purpose: the "lazy" demo of the web Cascader: a product category whose sub-levels load from the server the first
 *          time they are opened, with "Loading…" meanwhile.
 * Boundary: a demo with no props, @stackra/ui and local state only; the server is a timer. The same file is the preview
 *           and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { TreeViewNode } from "@stackra/ui/contracts";
import { Cascader, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { CASCADER_KEYS } from "#src/demos/free/cascader/cascader-keys.constant";

/** The demo's keys. */
const K = CASCADER_KEYS.cascader.lazy;

/** The rows under each top category, as the server would send them. */
const BELOW: Readonly<Record<string, readonly (keyof typeof K & string)[]>> = {
  women: ["abayas", "dresses"],
  men: ["thobes", "shoes"],
  home: ["kitchen", "bedding"],
  bedding: ["linen", "silk"],
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
    <div className="w-full max-w-sm">
      <Cascader
        label={t(K.label)}
        description={t(K.description)}
        items={[row("women"), row("men"), row("home")]}
        onLoadChildren={load}
      />
    </div>
  );
}
